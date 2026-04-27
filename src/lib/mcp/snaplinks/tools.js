import { z } from 'zod';
import { getBaseUrl } from '@/lib/mcp/oauth';
import { createLink, getLink, updateLink, recordClick } from '@/lib/apps/snaplinks/service/service';
import { WIDGETS, READ_ONLY_ANNOTATIONS, MUTATION_ANNOTATIONS } from './constants.js';
import { textResult, errorResult, toolMeta, widgetToolMeta, normalizeLink } from './utils.js';
import { buildLinksPayload, buildAnalyticsPayload } from './payloads.js';

export function registerSnaplinksTools(server) {
  const baseUrl = getBaseUrl();

  server.registerTool(
    'create_link',
    {
      title: 'Create Link',
      description:
        'Create a new short link with an optional custom slug. If `slug` is omitted, a random unique slug will be generated. Use this to shorten long URLs for easier sharing.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        slug: z.string().optional().describe('Lowercase slug (a-z0-9-)'),
        destination: z.string().min(1).describe('Destination URL'),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        expiresAt: z.string().optional().describe('ISO date string'),
        isActive: z.boolean().optional(),
      },
      _meta: toolMeta('Creating short link...', 'Short link created.'),
    },
    async (payload) => {
      try {
        const link = normalizeLink(await createLink(payload), baseUrl);
        return textResult(`Created short link: ${link.shortUrl} pointing to ${link.destination}`, {
          success: true,
          baseUrl,
          link,
        });
      } catch (err) {
        return errorResult(`Error creating link: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_link',
    {
      title: 'Get Link',
      description:
        'Retrieve detailed information about a specific short link using its unique slug, including its destination URL, title, tags, and status.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        slug: z.string().describe('Slug of the short link'),
      },
      _meta: toolMeta('Fetching short link...', 'Short link fetched.'),
    },
    async ({ slug }) => {
      if (!slug) return errorResult('slug is required');
      try {
        const linkRaw = await getLink(slug);
        if (!linkRaw) return errorResult('Link not found');
        const link = normalizeLink(linkRaw, baseUrl);
        return textResult(`Found short link: ${link.shortUrl} -> ${link.destination}`, link);
      } catch (err) {
        return errorResult(`Error: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'record_click',
    {
      title: 'Record Click',
      description:
        'Log a new click event for a short link and retrieve the destination URL for redirection. This tool tracks metadata like referrer and device info for analytics.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        slug: z.string().describe('Slug being clicked'),
        referrer: z.string().optional(),
        source: z.string().optional(),
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
        country: z.string().optional(),
        device: z.string().optional(),
        browser: z.string().optional(),
        os: z.string().optional(),
        ipHash: z.string().optional(),
      },
      _meta: toolMeta('Recording click...', 'Click recorded.'),
    },
    async (payload) => {
      try {
        const { click, link } = await recordClick(payload);
        const shortUrl = `${baseUrl}/r/${link.slug}`;
        return textResult(`Recorded click for ${shortUrl}. Redirecting to ${link.destination}`, {
          success: true,
          baseUrl,
          shortUrl,
          destination: link.destination,
          link: { id: link._id.toString(), slug: link.slug, shortUrl },
          clickId: click._id.toString(),
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'get_stats',
    {
      title: 'Get Link Analytics',
      description:
        'Fetch comprehensive analytics for a short link, including total clicks, unique visitors, top referrers, and traffic trends over a specific time window (default 30 days).',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        slug: z.string().optional().describe('Slug to fetch stats for'),
        id: z.string().optional().describe('ID to fetch stats for'),
        days: z.number().int().min(1).max(365).optional().describe('Days window (default 30)'),
      },
      _meta: widgetToolMeta(WIDGETS.analytics, 'Loading analytics...', 'Analytics ready.'),
    },
    async ({ slug, id, days }) => {
      if (!slug && !id) return errorResult('slug or id is required');
      try {
        const payload = await buildAnalyticsPayload({ slug, id, days }, baseUrl);
        return textResult(
          `Analytics for /${payload.slug} (last ${payload.windowDays} days): ${payload.stats.totalClicksWindow} clicks.`,
          payload
        );
      } catch (err) {
        return errorResult(`Error: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'list_links',
    {
      title: 'List Links',
      description:
        'Retrieve a list of existing short links, with support for filtering by tags, active status, or search terms. Ideal for managing and browsing created links.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional(),
        active: z.boolean().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
      _meta: widgetToolMeta(WIDGETS.links, 'Loading short links...', 'Links ready.'),
    },
    async (payload) => {
      try {
        const data = await buildLinksPayload(payload, baseUrl);
        return textResult(`Found ${data.links.length} short links.`, data);
      } catch (err) {
        return errorResult(`Error: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_link',
    {
      title: 'Update Link',
      description:
        'Modify the properties of an existing short link (destination, title, description, tags, expiration, or active status) using its slug.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        slug: z.string().describe('Slug of the link to update'),
        destination: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        expiresAt: z.string().optional(),
        isActive: z.boolean().optional(),
      },
      _meta: toolMeta('Updating short link...', 'Short link updated.'),
    },
    async (payload) => {
      if (!payload.slug) return errorResult('slug is required');
      try {
        const updated = await updateLink(payload.slug, payload);
        const link = normalizeLink(updated, baseUrl);
        return textResult(`Updated short link: ${link.shortUrl}`, { success: true, baseUrl, link });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );
}
