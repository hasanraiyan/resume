import { z } from 'zod';
import { TavilySearch } from '@langchain/tavily';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';
import keyRotationManager from '@/lib/providers/KeyRotationManager';
import { MCP_SCOPES } from './server-definitions';

/**
 * Helper to split keys string into array and sanitize them
 */
function splitKeys(keys) {
  if (!keys) return [];
  if (Array.isArray(keys)) return keys;
  return String(keys)
    .split(/[\n,]/)
    .map((k) => {
      return k
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/[{},]/g, '')
        .trim();
    })
    .filter((k) => k.length > 0 && !k.includes(':'));
}

export function createTavilySearchMcpTool() {
  return {
    name: 'tavily_search',
    title: 'Tavily Search',
    description:
      'Search the web for real-time information, news, articles, and general knowledge. Returns a list of search results with titles, URLs, and text snippets.',
    schema: z.object({
      query: z.string().describe('The search query (e.g., "latest news about Next.js 15")'),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe('Number of search results to return (default 5, max 10)'),
    }),
    outputSchema: z.object({
      results: z
        .array(
          z.object({
            title: z.string().optional().describe('Title of the search result page'),
            url: z.string().optional().describe('URL of the search result'),
            content: z.string().optional().describe('Relevant text snippet from the page'),
            score: z.number().optional().describe('Relevance score of the result'),
          })
        )
        .describe('List of search results'),
      error: z.string().optional().describe('Error message if the search failed'),
    }),
    annotations: {
      title: 'Tavily Search',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async invoke({ query, maxResults = 5 }) {
      const config = await dynamicSettingsManager.get('TAVILY_API_KEY');
      if (!config) {
        return {
          results: [],
          error: 'Tavily Search API key is missing. Please configure TAVILY_API_KEY in settings.',
        };
      }

      // Check Global Active State
      const isObject = typeof config === 'object' && !Array.isArray(config);
      if (isObject && config.isActive === false) {
        return {
          results: [],
          error: 'Tavily Search is globally disabled in Tools Settings.',
        };
      }

      // Extract Keys & Limits
      const keys = splitKeys(isObject ? config.keys : config);
      const limits = isObject ? { rpm: config.rpm, rpd: config.rpd, rpmnt: config.rpmnt } : {};

      if (keys.length === 0) {
        return {
          results: [],
          error: 'No Tavily API keys configured in settings.',
        };
      }

      // Register with Global Rotation Manager
      keyRotationManager.registerToolPool('TAVILY_SEARCH', keys, 'Tavily', limits);

      // Pick Next Available Key Globally
      const pooled = await keyRotationManager.getNextProvider('TAVILY_SEARCH');
      if (!pooled?.apiKey) {
        return {
          results: [],
          error: 'No available Tavily keys in pool (limits or quotas reached).',
        };
      }

      try {
        const tavily = new TavilySearch({
          maxResults,
          tavilyApiKey: pooled.apiKey,
        });

        const result = await tavily.invoke({ query });

        let results = [];
        if (typeof result === 'string') {
          try {
            results = JSON.parse(result);
          } catch (e) {
            results = [{ content: result }];
          }
        } else if (Array.isArray(result)) {
          results = result;
        } else if (result && typeof result === 'object') {
          results = [result];
        }

        return {
          results: Array.isArray(results) ? results : [],
        };
      } catch (err) {
        const msg = err.message?.toLowerCase() || '';
        if (err.status === 429 || msg.includes('limit') || msg.includes('credit')) {
          await keyRotationManager.markThrottled('TAVILY_SEARCH', pooled.internalId);
        }
        return {
          results: [],
          error: `Tavily API search failed: ${err.message}`,
        };
      }
    },
  };
}

export function createAllTavilyMcpTools({ scopes = [] } = {}) {
  const tools = [];
  const scopeSet = new Set(scopes);

  if (scopeSet.has(MCP_SCOPES.TAVILY_SEARCH) || scopes.length === 0) {
    tools.push(createTavilySearchMcpTool());
  }

  return tools;
}
