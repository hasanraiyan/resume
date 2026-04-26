export function textResult(text, structuredContent = undefined, extra = {}) {
  return {
    content: [{ type: 'text', text }],
    ...(structuredContent ? { structuredContent } : {}),
    ...extra,
  };
}

export function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function toolMeta(invoking, invoked, extra = {}) {
  return {
    'openai/toolInvocation/invoking': invoking,
    'openai/toolInvocation/invoked': invoked,
    ...extra,
  };
}

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
