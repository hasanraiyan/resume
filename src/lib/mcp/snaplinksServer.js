import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ShortLink from '@/models/ShortLink';
import LinkClick from '@/models/LinkClick';
import { getBaseUrl } from '@/lib/mcp/oauth';

function isValidObjectId(v) {
  return typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);
}

function generateSlug() {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${now}-${rand}`.slice(0, 50);
}

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
    async ({ slug, destination, title, description, tags, expiresAt, isActive }) => {
      try {
        if (!destination) {
          return { content: [{ type: 'text', text: 'destination is required' }], isError: true };
        }

        await dbConnect();

        let finalSlug = slug ? slug.trim().toLowerCase() : null;

        if (finalSlug) {
          if (!/^[a-z0-9-]+$/.test(finalSlug)) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid slug: only lowercase letters, numbers, and hyphens allowed',
                },
              ],
              isError: true,
            };
          }
          const exists = await ShortLink.findOne({ slug: finalSlug });
          if (exists) {
            return { content: [{ type: 'text', text: 'Slug already exists' }], isError: true };
          }
        } else {
          // generate a unique slug (few attempts)
          for (let i = 0; i < 6; i++) {
            const cand = generateSlug();
            // ensure candidate doesn't collide
            // eslint-disable-next-line no-await-in-loop
            const exists = await ShortLink.findOne({ slug: cand });
            if (!exists) {
              finalSlug = cand;
              break;
            }
          }
          if (!finalSlug) {
            return {
              content: [{ type: 'text', text: 'Unable to generate unique slug' }],
              isError: true,
            };
          }
        }

        const payload = {
          slug: finalSlug,
          destination,
          title: title || undefined,
          description: description || undefined,
          tags: tags || undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          isActive: typeof isActive === 'boolean' ? isActive : true,
        };

        const sl = new ShortLink(payload);
        await sl.save();
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
                    expiresAt: sl.expiresAt ? sl.expiresAt.toISOString() : null,
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
      await dbConnect();
      const s = await ShortLink.findOne({ slug: slug.trim().toLowerCase() }).lean();
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
                expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
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
      const {
        slug,
        referrer,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        country,
        device,
        browser,
        os,
        ipHash,
      } = payload;
      if (!slug) return { content: [{ type: 'text', text: 'slug is required' }], isError: true };

      await dbConnect();

      const s = await ShortLink.findOne({ slug: slug.trim().toLowerCase() });
      if (!s)
        return { content: [{ type: 'text', text: 'Link not found or inactive' }], isError: true };

      // check expiration
      if (s.expiresAt && s.expiresAt < new Date()) {
        return { content: [{ type: 'text', text: 'Link has expired' }], isError: true };
      }

      // create click and increment counter
      const click = new LinkClick({
        shortLink: s._id,
        slug: s.slug,
        referrer: referrer || 'Direct',
        source: source || undefined,
        utm_source: utm_source || undefined,
        utm_medium: utm_medium || undefined,
        utm_campaign: utm_campaign || undefined,
        country: country || undefined,
        device: device || undefined,
        browser: browser || undefined,
        os: os || undefined,
        ipHash: ipHash || undefined,
      });

      await Promise.all([
        click.save(),
        ShortLink.findByIdAndUpdate(s._id, { $inc: { totalClicks: 1 } }),
      ]);

      const shortUrl = `${baseUrl}/r/${s.slug}`;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                baseUrl,
                shortUrl,
                destination: s.destination,
                link: { id: s._id.toString(), slug: s.slug, shortUrl },
                clickId: click._id.toString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    'get_stats',
    {
      description:
        'Return analytics for a short link (top countries, referrers, and clicks over time).',
      inputSchema: {
        slug: z.string().describe('Slug to fetch stats for'),
        days: z.number().int().min(1).max(365).optional().describe('Days window (default 30)'),
      },
    },
    async ({ slug, days }) => {
      if (!slug) return { content: [{ type: 'text', text: 'slug is required' }], isError: true };
      const windowDays = days || 30;
      await dbConnect();
      const s = await ShortLink.findOne({ slug: slug.trim().toLowerCase() }).lean();
      if (!s) return { content: [{ type: 'text', text: 'Link not found' }], isError: true };

      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      // Aggregations
      const totalClicks = await LinkClick.countDocuments({
        shortLink: s._id,
        timestamp: { $gte: since },
      });

      const uniqueVisitorsAgg = await LinkClick.aggregate([
        {
          $match: {
            shortLink: s._id,
            ipHash: { $exists: true, $ne: null },
            timestamp: { $gte: since },
          },
        },
        { $group: { _id: '$ipHash' } },
        { $count: 'unique' },
      ]);
      const uniqueVisitors = uniqueVisitorsAgg?.[0]?.unique || 0;

      const topCountries = await LinkClick.aggregate([
        {
          $match: {
            shortLink: s._id,
            country: { $exists: true, $ne: null },
            timestamp: { $gte: since },
          },
        },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      const topReferrers = await LinkClick.aggregate([
        {
          $match: {
            shortLink: s._id,
            referrer: { $exists: true, $ne: null },
            timestamp: { $gte: since },
          },
        },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      const clicksOverTime = await LinkClick.aggregate([
        { $match: { shortLink: s._id, timestamp: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const shortUrl = `${baseUrl}/r/${s.slug}`;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                slug: s.slug,
                linkId: s._id.toString(),
                baseUrl,
                shortUrl,
                totalClicksWindow: totalClicks,
                uniqueVisitors,
                topCountries: topCountries.map((r) => ({ country: r._id, count: r.count })),
                topReferrers: topReferrers.map((r) => ({ referrer: r._id, count: r.count })),
                clicksOverTime: clicksOverTime.map((r) => ({ date: r._id, count: r.count })),
                windowDays,
              },
              null,
              2
            ),
          },
        ],
      };
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
    async ({ limit, active, tag, search }) => {
      await dbConnect();
      const query = {};
      if (active !== undefined) query.isActive = active;
      if (tag) query.tags = tag;
      if (search)
        query.$or = [{ slug: new RegExp(search, 'i') }, { title: new RegExp(search, 'i') }];

      const links = await ShortLink.find(query)
        .sort({ createdAt: -1 })
        .limit(limit || 50)
        .lean();
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
    async ({ slug, destination, title, description, tags, expiresAt, isActive }) => {
      if (!slug) return { content: [{ type: 'text', text: 'slug is required' }], isError: true };
      await dbConnect();
      const patch = {};
      if (destination !== undefined) patch.destination = destination;
      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (tags !== undefined) patch.tags = tags;
      if (expiresAt !== undefined) patch.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (isActive !== undefined) patch.isActive = isActive;

      const updated = await ShortLink.findOneAndUpdate(
        { slug: slug.trim().toLowerCase() },
        { $set: patch },
        { new: true }
      ).lean();

      if (!updated) return { content: [{ type: 'text', text: 'Link not found' }], isError: true };
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
    }
  );

  return server;
}
