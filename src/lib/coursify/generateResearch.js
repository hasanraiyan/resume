import dbConnect from '@/lib/dbConnect';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * @typedef {Object} GeneratedResearch
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} content
 * @property {string|null} summary
 * @property {Object} usage
 * @property {number} usage.promptTokens
 * @property {number} usage.completionTokens
 * @property {number} usage.totalTokens
 * @property {number} usage.estimatedCostUSD
 * @property {boolean} fromCache
 * @property {number} durationMs
 */

/**
 * @typedef {Object} GenerateResearchOptions
 * @property {boolean} [isReferenceEnabled]
 */

/**
 * Programmatic non-streaming research generation using only CoursifySearchAgent.
 * Handles caching, summary generation, slug uniqueness, and persistence.
 *
 * @param {string} topic
 * @param {GenerateResearchOptions} [options]
 * @returns {Promise<GeneratedResearch>}
 */
export async function generateResearch(topic, options = {}) {
  const { isReferenceEnabled = false } = options;

  if (!topic?.trim()) {
    throw new Error('topic is required');
  }

  await dbConnect();

  const { hashPrompt } = await import('@/lib/coursify/promptHasher');
  const { slugify } = await import('@/utils/string');
  const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;
  const { calculateEstimatedCostUSD } = await import('@/lib/agents/utils/pricing');

  const promptHash = hashPrompt(topic.trim(), isReferenceEnabled);

  // Check cache first
  const cachedResearch = await CoursifyResearch.findOne({ promptHash, deletedAt: null });
  if (cachedResearch) {
    return {
      id: String(cachedResearch._id),
      slug: cachedResearch.slug,
      title: cachedResearch.title,
      content: cachedResearch.content,
      summary: cachedResearch.summary,
      usage: cachedResearch.usage,
      fromCache: true,
      durationMs: cachedResearch.metadata?.durationMs ?? 0,
    };
  }

  const startTime = Date.now();

  // Run the Search Agent (non-streaming)
  const agentResult = await agentRegistry.execute(AGENT_IDS.COURSIFY_SEARCH, {
    topic: topic.trim(),
  });

  const { title: extractedTitle, content: finalContent, usage: agentUsage } = agentResult;

  if (!finalContent) {
    throw new Error('Agent returned empty content');
  }

  // Determine final title
  let baseTitle = topic.trim();
  const titleMatch = finalContent.match(/^#\s+(.+)$/m);
  if (titleMatch?.[1]) {
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
      summary = summaryResult.summary ?? null;
    }
  } catch (err) {
    console.error('[generateResearch] Summary generation failed:', err);
  }

  // Calculate cost
  const estimatedCostUSD = calculateEstimatedCostUSD(
    agentUsage?.promptTokens ?? 0,
    agentUsage?.completionTokens ?? 0
  );

  // Persist to database
  const research = await CoursifyResearch.create({
    topic: topic.trim(),
    title: baseTitle,
    content: finalContent,
    summary,
    slug,
    promptHash,
    titleHash: hashPrompt(baseTitle, isReferenceEnabled),
    usage: {
      promptTokens: agentUsage?.promptTokens ?? 0,
      completionTokens: agentUsage?.completionTokens ?? 0,
      totalTokens: agentUsage?.totalTokens ?? 0,
      estimatedCostUSD,
    },
    metadata: {
      durationMs: Date.now() - startTime,
      agentId: 'coursify_search',
    },
  });

  // Best-effort Qdrant upload
  try {
    const qdrantId = await uploadToQdrant(research);
    if (qdrantId) {
      await CoursifyResearch.findByIdAndUpdate(research._id, { qdrantId });
    }
  } catch (err) {
    console.error('[generateResearch] Qdrant upload failed (non-fatal):', err);
  }

  return {
    id: String(research._id),
    slug: research.slug,
    title: research.title,
    content: research.content,
    summary: research.summary,
    usage: research.usage,
    fromCache: false,
    durationMs: research.metadata?.durationMs ?? 0,
  };
}

async function uploadToQdrant(research) {
  const qdrantUrl = process.env.QDRANT_URL;
  if (!qdrantUrl) return null;

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
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Qdrant upload failed with status ${res.status}`);
  }

  return qdrantId;
}
