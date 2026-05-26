import { NextResponse } from 'next/server';
import { parseGenerateRequest } from '@/lib/coursify/api/parseGenerateRequest';
import { generateResearch } from '@/lib/coursify/generateResearch';
import { requireCoursifyAuth } from '@/lib/coursify-auth';

export async function POST(request) {
  const parsed = await parseGenerateRequest(request);

  if (parsed.errorResponse) {
    return parsed.errorResponse;
  }

  // ─── Authentication Check ───
  const authResult = await requireCoursifyAuth(request);
  const isAuthenticated = !(authResult instanceof NextResponse);

  // Restrict Pro generation to authenticated users only
  if (parsed.agent === 'pro' && !isAuthenticated) {
    return NextResponse.json(
      { error: 'Authentication required for Pro generation' },
      { status: 403 }
    );
  }

  const { topic, isReferenceEnabled } = parsed;

  try {
    const result = await generateResearch(topic, {
      isReferenceEnabled,
      agent: parsed.agent,
      isAuthenticated,
    });

    return NextResponse.json({
      success: true,
      fromCache: result.fromCache,
      research: {
        id: result.id,
        slug: result.slug,
        title: result.title,
        content: result.content,
        summary: result.summary,
        usage: result.usage,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[generate-sync] Error:', error);

    const status = error.message?.includes('required') ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status }
    );
  }
}
