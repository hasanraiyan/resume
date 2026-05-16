import { youtubeSearch } from '@/lib/agents/utils/youtube-tools'; // trigger rebuild
import { TavilySearch } from '@langchain/tavily';
import { NextResponse } from 'next/server';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

export async function POST(request) {
  try {
    const { tool, query, params = {} } = await request.json();

    if (!tool || !query) {
      return NextResponse.json({ error: 'tool and query are required' }, { status: 400 });
    }

    let result;
    const startTime = Date.now();

    switch (tool) {
      case 'youtube_search':
        result = await youtubeSearch.invoke({ query, ...params });
        break;
      case 'tavily_search':
        const apiKey = await dynamicSettingsManager.get('TAVILY_API_KEY');
        if (!apiKey) {
          return NextResponse.json(
            {
              success: false,
              error: 'TAVILY_API_KEY not found in database',
              debug: {
                retrievedKey: apiKey,
                keyType: typeof apiKey,
              },
            },
            { status: 400 }
          );
        }
        const tavily = new TavilySearch({ maxResults: 5, tavilyApiKey: apiKey });
        result = await tavily.invoke({ query });
        break;
      default:
        return NextResponse.json({ error: 'Invalid tool' }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // Parse result if it's a JSON string
    let parsedResult = result;
    try {
      if (typeof result === 'string') {
        parsedResult = JSON.parse(result);
      }
    } catch (e) {
      // Not JSON, keep as is
    }

    return NextResponse.json({
      success: true,
      tool,
      query,
      duration: `${duration}ms`,
      result: parsedResult,
    });
  } catch (error) {
    console.error('[DebugTools] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list_settings') {
      const keys = await dynamicSettingsManager.listSettingKeys();
      return NextResponse.json({ success: true, keys });
    }

    if (action === 'debug_key') {
      const key = searchParams.get('key');
      if (!key) {
        return NextResponse.json({ error: 'key parameter required' }, { status: 400 });
      }
      const debug = await dynamicSettingsManager.debugKey(key);
      return NextResponse.json({ success: true, debug });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[DebugTools GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
