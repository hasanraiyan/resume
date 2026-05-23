/** MCP OAuth scope → authorize UI metadata */
export const MCP_APPS = {
  pocketly: {
    name: 'Pocketly',
    description: 'Track your personal finances, manage accounts, and analyze spending.',
    icon: '/images/apps/pocketly.png',
  },
  snaplinks: {
    name: 'SnapLinks',
    description: 'Manage your short links and view click analytics.',
    icon: '/images/apps/Snaplinks.png',
  },
  coursify: {
    name: 'Coursify',
    description: 'Create and manage AI-powered courses with sections, content, and thumbnails.',
    icon: '/images/apps/coursify.png',
  },
  recall: {
    name: 'ReCall',
    description: 'Store, search, and manage your personal memory bank.',
    icon: '/images/apps/recall.png',
  },
  youtube: {
    name: 'YouTube Search',
    description: 'Find educational YouTube videos, tutorials, thumbnails, and direct video links.',
    icon: '/images/apps/youtube.svg',
  },
};

const RESOURCE_SCOPE_PATTERNS = [
  { pattern: /\/api\/mcp\/youtube\/?$/i, scope: 'youtube' },
  { pattern: /\/api\/mcp\/recall\/?$/i, scope: 'recall' },
  { pattern: /\/api\/mcp\/pocketly\/?$/i, scope: 'pocketly' },
  { pattern: /\/api\/mcp\/snaplinks\/?$/i, scope: 'snaplinks' },
  { pattern: /\/api\/mcp\/coursify\/?$/i, scope: 'coursify' },
];

export function getMcpResourceUrl(scope, baseUrl) {
  if (!scope || !MCP_APPS[scope]) return null;
  return `${baseUrl.replace(/\/$/, '')}/api/mcp/${scope}`;
}

export function scopeFromResource(resource) {
  if (!resource || typeof resource !== 'string') return null;
  const normalized = resource.trim();
  for (const { pattern, scope } of RESOURCE_SCOPE_PATTERNS) {
    if (pattern.test(normalized)) return scope;
  }
  try {
    const pathname = new URL(normalized).pathname;
    for (const { pattern, scope } of RESOURCE_SCOPE_PATTERNS) {
      if (pattern.test(pathname)) return scope;
    }
  } catch {
    // not a URL
  }
  return null;
}

export function parseScopeString(scope) {
  return (scope || '')
    .split(/[\s+,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && MCP_APPS[s]);
}

/** Resolve scopes from OAuth scope param and/or RFC 8707 resource URL */
export function resolveMcpScopes({ scope = '', resource = null } = {}) {
  const fromResource = scopeFromResource(resource);
  if (fromResource) {
    return [fromResource];
  }
  return parseScopeString(scope);
}

/** App key stored on AppConnection — prefer resource-specific app when present */
export function getPrimaryMcpScope({ scope = '', resource = null } = {}) {
  const scopes = resolveMcpScopes({ scope, resource });
  const fromResource = scopeFromResource(resource);
  if (fromResource) return fromResource;
  return scopes[0] || null;
}

export function getMcpAppsForScopes(scopes) {
  return scopes.map((key) => ({ key, ...MCP_APPS[key] })).filter((app) => app.name);
}

export const MCP_SCOPES_SUPPORTED = Object.keys(MCP_APPS);
