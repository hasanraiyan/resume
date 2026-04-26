import { listLinks, getAnalyticsOverview } from '@/lib/apps/snaplinks/service/service';
import { normalizeLink } from './utils.js';

export async function buildLinksPayload(payload, baseUrl) {
  const linksRaw = await listLinks(payload);
  const links = linksRaw.map((link) => normalizeLink(link, baseUrl));

  return {
    kind: 'links',
    stats: {
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.isActive).length,
      totalClicks: links.reduce((sum, link) => sum + link.totalClicks, 0),
    },
    links,
  };
}

export async function buildAnalyticsPayload({ slug, id, days = 30 }, baseUrl) {
  const stats = await getAnalyticsOverview({ slug, id, days });

  if (!stats || !stats.linkDetails) {
    throw new Error('Link not found');
  }

  return {
    kind: 'analytics',
    slug: stats.linkDetails.slug,
    linkId: stats.linkDetails._id.toString(),
    baseUrl,
    shortUrl: `${baseUrl}/r/${stats.linkDetails.slug}`,
    stats: {
      totalClicksWindow: stats.summary.totalClicks,
      uniqueVisitors: stats.summary.uniqueVisitors,
    },
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
    windowDays: days,
  };
}
