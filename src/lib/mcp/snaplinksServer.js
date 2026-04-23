import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getBaseUrl } from '@/lib/mcp/oauth';
import {
  createLink,
  getLink,
  updateLink,
  listLinks,
  recordClick,
  getAnalyticsOverview,
} from '@/lib/apps/snaplinks/service/service';

export function createSnaplinksMcpServer() {
  const server = new McpServer({ name: 'snaplinks', version: '1.0.0' });
  const baseUrl = getBaseUrl();

  server.registerTool(
    'create_link',
    {
      description: 'Create a short link. If `slug` is omitted a unique slug will be generated.',
      inputSchema: {
        slug: z.string().optional().describe('Lowercase slug (a-z0-9-)'),
        destination: z.string().min(1).describe('Destination URL'),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        expiresAt: z.string().optional().describe('ISO date string'),
        isActive: z.boolean().optional(),
      },
    },
    async (payload) => {
      try {
        const sl = await createLink(payload);
        const shortUrl = `${baseUrl}/r/${sl.slug}`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  baseUrl,
                  link: {
                    id: sl._id.toString(),
                    slug: sl.slug,
                    shortUrl,
                    destination: sl.destination,
                    title: sl.title || null,
                    description: sl.description || null,
                    tags: sl.tags || [],
                    expiresAt: sl.expiresAt ? new Date(sl.expiresAt).toISOString() : null,
                    isActive: sl.isActive,
                    totalClicks: sl.totalClicks || 0,
                    createdAt: sl.createdAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error creating link: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'get_link',
    {
      description: 'Fetch short link details by slug.',
      inputSchema: {
        slug: z.string().describe('Slug of the short link'),
      },
    },
    async ({ slug }) => {
      if (!slug) return { content: [{ type: 'text', text: 'slug is required' }], isError: true };

      try {
        const s = await getLink(slug);
        if (!s) return { content: [{ type: 'text', text: 'Link not found' }], isError: true };

        const shortUrl = `${baseUrl}/r/${s.slug}`;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: s._id.toString(),
                  slug: s.slug,
                  destination: s.destination,
                  title: s.title || null,
                  description: s.description || null,
                  tags: s.tags || [],
                  expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString() : null,
                  isActive: s.isActive,
                  totalClicks: s.totalClicks || 0,
                  createdAt: s.createdAt,
                  baseUrl,
                  shortUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'record_click',
    {
      description: 'Record a click for a short link and return the destination.',
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
    },
    async (payload) => {
      try {
        const { click, link } = await recordClick(payload);
        const shortUrl = `${baseUrl}/r/${link.slug}`;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  baseUrl,
                  shortUrl,
                  destination: link.destination,
                  link: { id: link._id.toString(), slug: link.slug, shortUrl },
                  clickId: click._id.toString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: err.message }], isError: true };
      }
    }
  );

  server.registerTool(
    'get_stats',
    {
      description:
        'Return analytics for a short link (top countries, referrers, and clicks over time).',
      inputSchema: {
        slug: z.string().optional().describe('Slug to fetch stats for (provide slug or id)'),
        id: z.string().optional().describe('ID to fetch stats for (provide slug or id)'),
        days: z.number().int().min(1).max(365).optional().describe('Days window (default 30)'),
      },
    },
    async ({ slug, id, days }) => {
      if (!slug && !id)
        return { content: [{ type: 'text', text: 'slug or id is required' }], isError: true };

      try {
        const stats = await getAnalyticsOverview({ slug, id, days });
        if (!stats.linkDetails) {
          return { content: [{ type: 'text', text: 'Link not found' }], isError: true };
        }

        const shortUrl = `${baseUrl}/r/${stats.linkDetails.slug}`;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  slug: stats.linkDetails.slug,
                  linkId: stats.linkDetails._id.toString(),
                  baseUrl,
                  shortUrl,
                  totalClicksWindow: stats.summary.totalClicks,
                  uniqueVisitors: stats.summary.uniqueVisitors,
                  topCountries: stats.countries.map((r) => ({
                    country: r.country,
                    count: r.count,
                  })),
                  topReferrers: stats.topReferrers.map((r) => ({
                    referrer: r.referrer,
                    count: r.count,
                  })),
                  clicksOverTime: stats.clicksOverTime.map((r) => ({
                    date: r.date,
                    count: r.clicks,
                  })),
                  windowDays: days || 30,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'list_links',
    {
      description: 'List short links with optional filters (tag, active).',
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional(),
        active: z.boolean().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (payload) => {
      try {
        const links = await listLinks(payload);
        const data = links.map((l) => {
          const shortUrl = `${baseUrl}/r/${l.slug}`;
          return {
            id: l._id.toString(),
            slug: l.slug,
            shortUrl,
            baseUrl,
            destination: l.destination,
            title: l.title || null,
            isActive: l.isActive,
            totalClicks: l.totalClicks || 0,
            createdAt: l.createdAt,
          };
        });

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'update_link',
    {
      description: 'Update a short link by slug (destination, title, tags, expiresAt, isActive).',
      inputSchema: {
        slug: z.string().describe('Slug of the link to update'),
        destination: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        expiresAt: z.string().optional(),
        isActive: z.boolean().optional(),
      },
    },
    async (payload) => {
      if (!payload.slug)
        return { content: [{ type: 'text', text: 'slug is required' }], isError: true };

      try {
        const updated = await updateLink(payload.slug, payload);
        const shortUrl = `${baseUrl}/r/${updated.slug}`;
        const linkObj = { ...updated, shortUrl };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, baseUrl, link: linkObj }, null, 2),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: err.message }], isError: true };
      }
    }
  );

  return server;
}
