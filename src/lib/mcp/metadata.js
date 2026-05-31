import { getMcpServerDefinition, listMcpServerDefinitions } from '@/lib/mcp/factory';

export function buildProtectedResourceMetadata({ origin, serverKey = null }) {
  const definition = serverKey ? getMcpServerDefinition(serverKey) : null;

  if (serverKey && !definition) {
    return null;
  }

  return {
    resource: definition ? `${origin}/api/mcp/${definition.key}` : `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: definition
      ? definition.supportedScopes
      : listMcpServerDefinitions().flatMap((server) => server.supportedScopes),
    bearer_methods_supported: ['header'],
    resource_documentation: `${origin}/api/mcp/connections`,
    mcp_servers: listMcpServerDefinitions().map((server) => ({
      key: server.key,
      name: server.name,
      description: server.description,
      resource: `${origin}/api/mcp/${server.key}`,
      scopes_supported: server.supportedScopes,
      scope_descriptions: server.scopeDescriptions,
    })),
  };
}

export function getServerKeyFromProtectedResourcePath(resourcePath = []) {
  const parts = Array.isArray(resourcePath) ? resourcePath : [];
  const mcpIndex = parts.findIndex((part) => part === 'mcp');

  if (mcpIndex === -1) {
    return null;
  }

  return parts[mcpIndex + 1] || null;
}
