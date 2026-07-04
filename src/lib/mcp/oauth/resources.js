/**
 * Registry of MCP resource servers protected by the shared OAuth authorization
 * server. To wire up OAuth for a new MCP server: add an entry here, then call
 * `createMcpTokenVerifier(key)` + `withMcpAuth` in that server's route.js.
 */
export const MCP_OAUTH_RESOURCES = {
  'attenda-mcp': {
    path: '/api/attenda-mcp',
    appKey: 'attenda-mcp',
    scope: 'attenda-mcp',
    displayName: 'Attenda MCP',
    apiKeyEnvVar: 'ATTENDA_MCP_API_KEY',
  },
};

export function getMcpResourceConfig(key) {
  return MCP_OAUTH_RESOURCES[key];
}

export function resolveResourceKeyFromUrl(resourceUrl) {
  if (!resourceUrl) return undefined;
  try {
    const { pathname } = new URL(resourceUrl);
    return Object.keys(MCP_OAUTH_RESOURCES).find(
      (key) => MCP_OAUTH_RESOURCES[key].path === pathname
    );
  } catch {
    return undefined;
  }
}
