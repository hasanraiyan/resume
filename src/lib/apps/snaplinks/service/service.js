import dbConnect from '@/lib/dbConnect';
import ShortLink from '@/models/ShortLink';
import LinkClick from '@/models/LinkClick';
import {
  isValidObjectId,
  CreateShortLinkSchema,
  UpdateShortLinkSchema,
  RecordClickSchema,
} from './validators';

export async function ensureDb() {
  await dbConnect();
}

function generateSlug() {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${now}-${rand}`.slice(0, 50);
}

export async function ensureUniqueSlug(desiredSlug = null) {
  await ensureDb();
  let finalSlug = desiredSlug ? desiredSlug.trim().toLowerCase() : null;

  if (finalSlug) {
    if (finalSlug.length > 50) {
      throw new Error('Slug cannot exceed 50 characters');
    }
    if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      throw new Error('Invalid slug: only lowercase letters, numbers, and hyphens allowed');
    }
    const exists = await ShortLink.findOne({ slug: finalSlug });
    if (exists) {
      throw new Error('Slug already exists');
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const cand = generateSlug();
      const exists = await ShortLink.findOne({ slug: cand });
      if (!exists) {
        finalSlug = cand;
        break;
      }
    }
    if (!finalSlug) {
      throw new Error('Unable to generate unique slug');
    }
  }
  return finalSlug;
}

export async function createLink(payload) {
  await ensureDb();
  const validated = CreateShortLinkSchema.parse(payload);

  const finalSlug = await ensureUniqueSlug(validated.slug);

  const link = new ShortLink({
    ...validated,
    slug: finalSlug,
    tags: Array.isArray(validated.tags) ? validated.tags : [],
    expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    isActive: validated.isActive !== undefined ? validated.isActive : true,
  });

  await link.save();
  return link.toObject();
}

export async function getLink(slugOrId) {
  await ensureDb();
  let link;

  // Prefer slug lookup first to support 24-hex alphanumeric slugs
  link = await ShortLink.findOne({ slug: slugOrId.trim().toLowerCase() }).lean();

  // Fallback to ObjectId lookup if not found by slug
  if (!link && isValidObjectId(slugOrId)) {
    link = await ShortLink.findById(slugOrId).lean();
  }

  return link;
}

export async function listLinks({ active, tag, search, limit } = {}) {
  await ensureDb();
  const query = {};
  if (active !== undefined) query.isActive = active;
  if (tag) query.tags = tag;
  if (search) {
    query.$or = [{ slug: new RegExp(search, 'i') }, { title: new RegExp(search, 'i') }];
  }

  let dbQuery = ShortLink.find(query).sort({ createdAt: -1 });
  if (limit) {
    dbQuery = dbQuery.limit(limit);
  }

  return await dbQuery.lean();
}

export async function updateLink(slugOrId, patch) {
  await ensureDb();
  const validated = UpdateShortLinkSchema.parse(patch);

  let linkToUpdate = await getLink(slugOrId);
  if (!linkToUpdate) throw new Error('Short link not found');

  if (validated.slug && validated.slug.toLowerCase() !== linkToUpdate.slug) {
    // Re-verify new slug
    const existing = await ShortLink.findOne({ slug: validated.slug.toLowerCase(), _id: { $ne: linkToUpdate._id } });
    if (existing) {
      throw new Error('New slug already exists');
    }
    validated.slug = validated.slug.toLowerCase();
  }

  if (validated.expiresAt !== undefined) {
    validated.expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
  }

  const updated = await ShortLink.findByIdAndUpdate(
    linkToUpdate._id,
    { $set: validated },
    { new: true, runValidators: true }
  ).lean();

  return updated;
}

export async function deleteLink(slugOrId) {
  await ensureDb();
  const link = await getLink(slugOrId);
  if (!link) throw new Error('Short link not found');

  await LinkClick.deleteMany({ shortLink: link._id });
  await ShortLink.findByIdAndDelete(link._id);
  return true;
}

export async function recordClick(payload) {
  await ensureDb();
  const validated = RecordClickSchema.parse(payload);

  const link = await ShortLink.findOne({ slug: validated.slug.trim().toLowerCase() });
  if (!link) throw new Error('Link not found or inactive');

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new Error('Link has expired');
  }

  const click = new LinkClick({
    shortLink: link._id,
    slug: link.slug,
    referrer: validated.referrer || 'Direct',
    source: validated.source || undefined,
    utm_source: validated.utm_source || undefined,
    utm_medium: validated.utm_medium || undefined,
    utm_campaign: validated.utm_campaign || undefined,
    country: validated.country || undefined,
    device: validated.device || undefined,
    browser: validated.browser || undefined,
    os: validated.os || undefined,
    ipHash: validated.ipHash || undefined,
  });

  await Promise.all([
    click.save(),
    ShortLink.findByIdAndUpdate(link._id, { $inc: { totalClicks: 1 } }),
  ]);

  return { click: click.toObject(), link: link.toObject() };
}

export async function getDashboardStats() {
  await ensureDb();

  const [totalLinks, activeLinks, totalClicksAggregation, topLinkResult] = await Promise.all([
    ShortLink.countDocuments({}),
    ShortLink.countDocuments({ isActive: true }),
    ShortLink.aggregate([{ $group: { _id: null, totalClicks: { $sum: '$totalClicks' } } }]),
    ShortLink.find({}).sort({ totalClicks: -1 }).limit(1).select('slug title totalClicks').lean(),
  ]);

  const totalClicks = totalClicksAggregation[0]?.totalClicks || 0;
  const topLink = topLinkResult.length > 0 ? topLinkResult[0] : null;

  return {
    totalLinks,
    activeLinks,
    totalClicks,
    topLink,
  };
}

export async function getAnalyticsOverview({ slug, id, days = 30 } = {}) {
  await ensureDb();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const matchCriteria = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  let linkDetails = null;
  const identifier = id || slug;
  if (identifier) {
    linkDetails = await getLink(identifier);
    if (!linkDetails) {
      throw new Error('Short link not found');
    }
    matchCriteria.shortLink = linkDetails._id;
  } else {
    linkDetails = {
      totalLinksCreated: await ShortLink.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    };
  }

  const [
    totalClicksResult,
    uniqueVisitorsResult,
    clicksOverTime,
    topReferrers,
    topSources,
    topCampaigns,
    devices,
    countries,
  ] = await Promise.all([
    LinkClick.countDocuments(matchCriteria),
    LinkClick.distinct('ipHash', matchCriteria).then((hashes) => hashes.length),
    LinkClick.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          clicks: '$count',
        },
      },
    ]),
    LinkClick.aggregate([
      { $match: matchCriteria },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, referrer: '$_id', count: 1 } },
    ]),
    LinkClick.aggregate([
      {
        $match: {
          ...matchCriteria,
          source: { $ne: '', $exists: true },
        },
      },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, source: '$_id', count: 1 } },
    ]),
    LinkClick.aggregate([
      {
        $match: {
          ...matchCriteria,
          utm_campaign: { $ne: '', $exists: true },
        },
      },
      { $group: { _id: '$utm_campaign', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, campaign: '$_id', count: 1 } },
    ]),
    LinkClick.aggregate([
      { $match: matchCriteria },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, device: '$_id', count: 1 } },
    ]),
    LinkClick.aggregate([
      { $match: matchCriteria },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, country: '$_id', count: 1 } },
    ]),
  ]);

  return {
    summary: {
      totalClicks: totalClicksResult,
      uniqueVisitors: uniqueVisitorsResult,
    },
    linkDetails,
    clicksOverTime,
    topReferrers,
    topSources,
    topCampaigns,
    devices,
    countries,
  };
}
