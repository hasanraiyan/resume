import { NextResponse } from 'next/server';
import { parseGenerateRequest } from '@/lib/coursify/api/parseGenerateRequest';
import { generateResearch } from '@/lib/coursify/generateResearch';

export async function POST(request) {
  const parsed = await parseGenerateRequest(request);

  if (parsed.errorResponse) {
    return parsed.errorResponse;
  }

  const { topic, isReferenceEnabled } = parsed;

  try {
    const result = await generateResearch(topic, { isReferenceEnabled });

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
