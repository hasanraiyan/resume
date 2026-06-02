import { TavilySearch } from '@langchain/tavily';
import { NextResponse } from 'next/server';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS_LIMIT = 10;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.TAVILY_TOOL_ALLOWED_ORIGIN || '*',
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

function splitKeys(keys) {
  if (!keys) {
    return [];
  }

  if (Array.isArray(keys)) {
    return keys;
  }

  return String(keys)
    .split(/[\n,]/)
    .map((key) =>
      key
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/[{},]/g, '')
        .trim()
    )
    .filter((key) => key.length > 0 && !key.includes(':'));
}

async function getTavilyApiKey() {
  const config = await dynamicSettingsManager.get('TAVILY_API_KEY');

  if (!config) {
    return { apiKey: null };
  }

  if (typeof config === 'object' && !Array.isArray(config)) {
    if (config.isActive === false) {
      return { apiKey: null, error: 'Tavily search is disabled in tool settings' };
    }

    return { apiKey: splitKeys(config.keys)[0] || null };
  }

  return { apiKey: splitKeys(config)[0] || null };
}

function normalizeResults(result) {
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      return [{ content: result }];
    }
  }

  if (Array.isArray(result)) {
    return result;
  }

  if (result?.results && Array.isArray(result.results)) {
    return result.results;
  }

  if (result && typeof result === 'object') {
    return [result];
  }

  return [];
}

async function searchTavily({ query, maxResults }) {
  const cleanQuery = String(query || '').trim();

  if (!cleanQuery) {
    return json({ success: false, error: 'query is required', results: [] }, { status: 400 });
  }

  if (cleanQuery.length > 300) {
    return json(
      { success: false, error: 'query must be 300 characters or less', results: [] },
      { status: 400 }
    );
  }

  const { apiKey, error } = await getTavilyApiKey();
  if (error) {
    return json({ success: false, error, results: [] }, { status: 503 });
  }

  if (!apiKey) {
    return json(
      { success: false, error: 'Tavily search is unavailable: TAVILY_API_KEY is not configured' },
      { status: 503 }
    );
  }

  const finalMaxResults = normalizeMaxResults(maxResults);
  const startTime = Date.now();

  try {
    const tavily = new TavilySearch({
      maxResults: finalMaxResults,
      tavilyApiKey: apiKey,
    });

    const result = await tavily.invoke({ query: cleanQuery });
    const results = normalizeResults(result);

    return json({
      success: true,
      query: cleanQuery,
      maxResults: finalMaxResults,
      count: results.length,
      durationMs: Date.now() - startTime,
      results,
    });
  } catch (error) {
    console.error('[TavilySearchAPI] Search failed:', error);
    return json(
      {
        success: false,
        query: cleanQuery,
        error: `Tavily API search failed: ${error.message}`,
        results: [],
      },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    return searchTavily({
      query: searchParams.get('query') || searchParams.get('q'),
      maxResults: searchParams.get('maxResults') || searchParams.get('limit'),
    });
  } catch (error) {
    console.error('[TavilySearchAPI] GET failed:', error);
    return json({ success: false, error: 'Failed to search Tavily', results: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    return searchTavily({
      query: body?.query || body?.q,
      maxResults: body?.maxResults || body?.limit,
    });
  } catch (error) {
    console.error('[TavilySearchAPI] POST failed:', error);
    return json({ success: false, error: 'Failed to search Tavily', results: [] }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
