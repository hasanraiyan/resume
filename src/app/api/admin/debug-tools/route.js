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

    // Map tool names to DB key names
    const keyMap = {
      youtube_search: 'GOOGLE_API_KEY',
      tavily_search: 'TAVILY_API_KEY',
      firecrawl_scrape: 'FIRECRAWL_SCRAPE_API_KEY',
    };

    const dbKeyName = keyMap[tool];
    let activeKey = params.apiKey;

    if (!activeKey && dbKeyName) {
      const config = await dynamicSettingsManager.get(dbKeyName);
      // Handle both old format (string) and new format (config object)
      if (typeof config === 'object' && !Array.isArray(config)) {
        activeKey = config.keys?.split(/[\n,]/)[0]?.trim();
      } else if (Array.isArray(config)) {
        activeKey = config[0];
      } else {
        activeKey = String(config).split(/[\n,]/)[0]?.trim();
      }
    }

    switch (tool) {
      case 'youtube_search':
        if (!activeKey) throw new Error('YouTube API key not found');
        result = await youtubeSearch.invoke(
          { query, ...params },
          { configurable: { apiKey: activeKey } }
        );
        break;
      case 'tavily_search':
        if (!activeKey) throw new Error('Tavily API key not found');
        const tavily = new TavilySearch({ maxResults: 5, tavilyApiKey: activeKey });
        result = await tavily.invoke({ query });
        break;
      case 'firecrawl_scrape':
        const { firecrawlScrape } = await import('@/lib/agents/utils/firecrawl-tool');
        if (!activeKey) throw new Error('Firecrawl API key not found');
        result = await firecrawlScrape.invoke(
          { url: query },
          { configurable: { apiKey: activeKey } }
        );
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

    if (action === 'get_decrypted_key') {
      const keyName = searchParams.get('keyName');
      const index = parseInt(searchParams.get('index') || '0');
      if (!keyName) return NextResponse.json({ error: 'keyName required' }, { status: 400 });

      const config = await dynamicSettingsManager.get(keyName);
      let keys = [];
      if (typeof config === 'object' && !Array.isArray(config)) {
        keys = (config.keys || '').split(/[\n,]/).map((k) => k.trim());
      } else if (Array.isArray(config)) {
        keys = config;
      } else {
        keys = String(config)
          .split(/[\n,]/)
          .map((k) => k.trim());
      }

      const fullKey = keys[index];
      if (!fullKey) return NextResponse.json({ error: 'Key not found at index' }, { status: 404 });

      return NextResponse.json({ success: true, fullKey });
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
