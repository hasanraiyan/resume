import { NextResponse } from 'next/server';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';
import { youtubeSearch } from '@/lib/agents/utils/youtube-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS_LIMIT = 10;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.YOUTUBE_TOOL_ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

function normalizeMaxResults(value) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return 5;
  }

  return Math.min(Math.max(parsed, 1), MAX_RESULTS_LIMIT);
}

async function getYoutubeApiKey() {
  const config = await dynamicSettingsManager.get('GOOGLE_API_KEY');

  if (!config) {
    return null;
  }

  if (typeof config === 'object' && !Array.isArray(config)) {
    return config.keys?.split(/[\n,]/)[0]?.trim() || null;
  }

  if (Array.isArray(config)) {
    return config[0] || null;
  }

  return String(config).split(/[\n,]/)[0]?.trim() || null;
}

function parseToolResult(result) {
  try {
    const parsed = JSON.parse(result);
    return {
      success: true,
      videos: Array.isArray(parsed) ? parsed : [],
    };
  } catch (error) {
    const message = typeof result === 'string' ? result : String(result);

    if (message.toLowerCase().includes('no relevant videos')) {
      return {
        success: true,
        videos: [],
        message,
      };
    }

    return {
      success: false,
      videos: [],
      error: message,
    };
  }
}

async function searchYoutube({ query, maxResults }) {
  const cleanQuery = String(query || '').trim();

  if (!cleanQuery) {
    return json({ success: false, error: 'query is required', videos: [] }, { status: 400 });
  }

  if (cleanQuery.length > 200) {
    return json(
      { success: false, error: 'query must be 200 characters or less', videos: [] },
      { status: 400 }
    );
  }

  const apiKey = await getYoutubeApiKey();
  if (!apiKey) {
    return json(
      { success: false, error: 'YouTube search is unavailable: GOOGLE_API_KEY is not configured' },
      { status: 503 }
    );
  }

  const finalMaxResults = normalizeMaxResults(maxResults);
  const startTime = Date.now();
  const result = await youtubeSearch.invoke(
    { query: cleanQuery, maxResults: finalMaxResults },
    { configurable: { apiKey } }
  );
  const parsed = parseToolResult(result);

  if (!parsed.success) {
    return json(
      {
        success: false,
        query: cleanQuery,
        error: parsed.error,
        videos: [],
      },
      { status: 502 }
    );
  }

  return json({
    success: true,
    query: cleanQuery,
    maxResults: finalMaxResults,
    count: parsed.videos.length,
    durationMs: Date.now() - startTime,
    videos: parsed.videos,
    ...(parsed.message ? { message: parsed.message } : {}),
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    return searchYoutube({
      query: searchParams.get('query') || searchParams.get('q'),
      maxResults: searchParams.get('maxResults') || searchParams.get('limit'),
    });
  } catch (error) {
    console.error('[YouTubeSearchAPI] GET failed:', error);
    return json({ success: false, error: 'Failed to search YouTube', videos: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    return searchYoutube({
      query: body?.query || body?.q,
      maxResults: body?.maxResults || body?.limit,
    });
  } catch (error) {
    console.error('[YouTubeSearchAPI] POST failed:', error);
    return json({ success: false, error: 'Failed to search YouTube', videos: [] }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
