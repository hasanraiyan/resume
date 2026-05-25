import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';

import '@/lib/agents';
import '@/lib/agents/ai/coursify-summary-agent';

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { topic, isReferenceEnabled = false } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    await dbConnect();

    const { hashPrompt } = await import('@/lib/coursify/promptHasher');
    const { slugify } = await import('@/utils/string');
    const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

    const promptHash = hashPrompt(topic.trim(), isReferenceEnabled);

    // Check cache first
    let cachedResearch = await CoursifyResearch.findOne({ promptHash, deletedAt: null });
    if (cachedResearch) {
      return NextResponse.json({
        success: true,
        fromCache: true,
        research: {
          id: String(cachedResearch._id),
          slug: cachedResearch.slug,
          title: cachedResearch.title,
          content: cachedResearch.content,
          summary: cachedResearch.summary,
          usage: cachedResearch.usage,
          createdAt: cachedResearch.createdAt,
        },
      });
    }

    // === Run the Search Agent non-streaming ===
    console.log(`[GenerateSync] Running CoursifySearchAgent (non-stream) for: "${topic}"`);

    const startTime = Date.now();

    const result = await agentRegistry.execute(AGENT_IDS.COURSIFY_SEARCH, {
      topic: topic.trim(),
    });

    const { title: extractedTitle, content: finalContent, usage: agentUsage } = result;

    if (!finalContent) {
      return NextResponse.json({ error: 'Agent returned empty content' }, { status: 500 });
    }

    // Generate title
    let baseTitle = topic.trim();
    const titleMatch = finalContent.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      baseTitle = titleMatch[1].trim();
    }

    // Generate unique slug
    let slug = slugify(baseTitle);
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await CoursifyResearch.findOne({ slug, deletedAt: null });
      if (existing) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slugify(baseTitle)}-${suffix}`;
        attempts++;
      } else {
        isUnique = true;
      }
    }

    // Generate summary
    let summary = null;
    try {
      const summaryAgent = agentRegistry.get(AGENT_IDS.COURSIFY_SUMMARY);
      if (summaryAgent) {
        await summaryAgent.initialize();
        const summaryResult = await summaryAgent.execute({ content: finalContent });
        summary = summaryResult.summary;
        console.log('[GenerateSync] Summary generated successfully');
      }
    } catch (summaryErr) {
      console.error('[GenerateSync] Summary generation failed:', summaryErr.message);
    }

    // Calculate cost
    const { calculateEstimatedCostUSD } = await import('@/lib/agents/utils/pricing');
    const estimatedCostUSD = calculateEstimatedCostUSD(
      agentUsage.promptTokens || 0,
      agentUsage.completionTokens || 0
    );

    // Save to DB
    const research = await CoursifyResearch.create({
      topic: topic.trim(),
      title: baseTitle,
      content: finalContent,
      summary,
      slug,
      promptHash,
      titleHash: hashPrompt(baseTitle, isReferenceEnabled),
      usage: {
        promptTokens: agentUsage.promptTokens || 0,
        completionTokens: agentUsage.completionTokens || 0,
        totalTokens: agentUsage.totalTokens || 0,
        estimatedCostUSD,
      },
      metadata: {
        durationMs: Date.now() - startTime,
        agentId: 'coursify_search',
      },
    });

    console.log(`[GenerateSync] Saved research "${slug}" to database`);

    // Optional: Upload to Qdrant (best effort)
    try {
      const qdrantId = await uploadToQdrant(research);
      if (qdrantId) {
        await CoursifyResearch.findByIdAndUpdate(research._id, { qdrantId });
      }
    } catch (qErr) {
      console.error('[GenerateSync] Qdrant upload failed (non-fatal):', qErr.message);
    }

    return NextResponse.json({
      success: true,
      fromCache: false,
      research: {
        id: String(research._id),
        slug: research.slug,
        title: research.title,
        content: research.content,
        summary: research.summary,
        usage: research.usage,
        createdAt: research.createdAt,
      },
    });
  } catch (error) {
    console.error('[GenerateSync] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Re-use the Qdrant upload helper from the main generate route
async function uploadToQdrant(research) {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('[GenerateSync] QDRANT_URL not set, skipping Qdrant upload');
      return null;
    }

    const { PollinationsEmbeddings } = await import('@/lib/coursify/PollinationsEmbeddings');
    const embeddings = new PollinationsEmbeddings();
    const text = `${research.title}\n${research.topic}`;
    const [vector] = await embeddings.embedDocuments([text]);

    const qdrantId = crypto.randomUUID();

    const res = await fetch(`${qdrantUrl}/collections/coursify_research/points`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {}),
      },
      body: JSON.stringify({
        points: [
          {
            id: qdrantId,
            vector,
            payload: {
              page_content: text,
              metadata: {
                slug: research.slug,
                title: research.title,
                topic: research.topic,
                createdAt: research.createdAt?.toISOString(),
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Qdrant PUT failed: ${res.status}`);
    }

    console.log(`[GenerateSync] Uploaded "${research.slug}" to Qdrant (id: ${qdrantId})`);
    return qdrantId;
  } catch (err) {
    console.error('[GenerateSync] Qdrant upload error:', err.message);
    return null;
  }
}
