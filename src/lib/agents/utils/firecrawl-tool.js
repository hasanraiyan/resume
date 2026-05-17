import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { FireCrawlLoader } from '@langchain/community/document_loaders/web/firecrawl';

/**
 * Firecrawl Scrape Tool
 * Converts a URL into clean Markdown for LLM consumption.
 */
export const firecrawlScrape = tool(
  async ({ url }, { configurable } = {}) => {
    const apiKey = configurable?.apiKey;

    if (!apiKey) {
      return 'Firecrawl API key is missing. Scrape unavailable.';
    }

    try {
      const loader = new FireCrawlLoader({
        url,
        apiKey,
        mode: 'scrape',
        params: {
          formats: ['markdown'],
        },
      });

      const docs = await loader.load();

      if (!docs || docs.length === 0) {
        return 'Failed to scrape the website: No content returned.';
      }

      // Return the markdown content and some metadata
      const result = {
        content: docs[0].pageContent,
        title: docs[0].metadata?.title || 'Unknown Title',
        description: docs[0].metadata?.description || '',
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('[FirecrawlTool] Scrape failed:', error);
      return `Firecrawl error: ${error.message}`;
    }
  },
  {
    name: 'firecrawl_scrape',
    description:
      'Scrape a specific URL and convert it into clean Markdown. Use this when you have a specific URL (from search results) and need to "read" the full content of the page deeply.',
    schema: z.object({
      url: z.string().url().describe('The URL of the website to scrape.'),
    }),
  }
);
