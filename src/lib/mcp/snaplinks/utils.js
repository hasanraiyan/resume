import { textResult, errorResult, toolMeta } from '../utils.js';

export { textResult, errorResult, toolMeta };

export function widgetToolMeta(widget, invoking, invoked) {
  return toolMeta(invoking, invoked, {
    ui: { resourceUri: widget.uri },
    'openai/outputTemplate': widget.uri,
  });
}

export function normalizeLink(link, baseUrl) {
  return {
    id: link._id?.toString() || link.id,
    slug: link.slug,
    shortUrl: `${baseUrl}/r/${link.slug}`,
    destination: link.destination,
    title: link.title || null,
    description: link.description || null,
    tags: link.tags || [],
    expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString() : null,
    isActive: link.isActive,
    totalClicks: link.totalClicks || 0,
    createdAt: link.createdAt ? new Date(link.createdAt).toISOString() : null,
  };
}
