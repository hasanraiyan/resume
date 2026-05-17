import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import FirecrawlApp from '@mendable/firecrawl-js';

/**
 * Firecrawl Scrape Tool
 * Converts a URL into clean Markdown for LLM consumption.
 * Uses the official SDK for maximum reliability.
 */
export const firecrawlScrape = tool(
  async ({ url }, { configurable } = {}) => {
    const apiKey = configurable?.apiKey;

    console.log(`[FirecrawlTool] Scraping URL: ${url}`);
    if (apiKey) {
      console.log(
        `[FirecrawlTool] Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`
      );
    } else {
      console.warn('[FirecrawlTool] API key is missing in configurable context.');
      return 'Firecrawl API key is missing. Scrape unavailable.';
    }

    try {
      // Use the SDK directly for better error reporting and control
      const app = new FirecrawlApp({ apiKey });

      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html'],
      });

      if (!scrapeResult.success) {
        console.error('[FirecrawlTool] SDK reported failure:', scrapeResult.error);
        return `Firecrawl error: ${scrapeResult.error || 'Unknown error'}`;
      }

      if (!scrapeResult.data) {
        console.warn('[FirecrawlTool] SDK returned success: true but no data object.');
        return 'Failed to scrape: No data returned from Firecrawl.';
      }

      const { markdown, html, metadata } = scrapeResult.data;
      console.log(`[FirecrawlTool] SDK Success! Metadata:`, JSON.stringify(metadata, null, 2));

      const result = {
        content: markdown || '',
        title: metadata?.title || metadata?.ogTitle || 'Unknown Title',
        description: metadata?.description || metadata?.ogDescription || '',
        url: metadata?.sourceURL || url,
        statusCode: metadata?.statusCode || 200,
      };

      if (result.content.length === 0 && html) {
        console.warn('[FirecrawlTool] Markdown empty, falling back to HTML snippet.');
        result.content = `[HTML Content - Markdown conversion failed]\n\n${html.substring(0, 5000)}`;
      }

      console.log(
        `[FirecrawlTool] Final Result - Title: ${result.title}. Content length: ${result.content.length}`
      );
      return JSON.stringify(result);
    } catch (error) {
      console.error('[FirecrawlTool] SDK Exception:', error.message);
      return `Firecrawl exception: ${error.message}`;
    }
  },
  {
    name: 'firecrawl_scrape',
    description:
      'Scrape a specific URL and convert it into clean Markdown. Use this when you have a specific URL and need to "read" the full content of the page deeply.',
    schema: z.object({
      url: z.string().url().describe('The URL of the website to scrape.'),
    }),
  }
);
