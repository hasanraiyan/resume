import { createAccessToken, getBaseUrl } from '@/lib/mcp/oauth';
import { MCP_SCOPES_SUPPORTED } from '@/lib/mcp/scopes';

export async function buildMcpClientConfig(configs) {
  const ownHostname = new URL(getBaseUrl()).hostname;
  const internalToken = await createAccessToken({
    clientId: 'internal-admin',
    scope: MCP_SCOPES_SUPPORTED.join(' '),
  });

  return configs.reduce((serverConfig, cfg) => {
    if (!cfg || cfg.type === 'rest' || !cfg.url) return serverConfig;

    let mcpHostname = '';
    try {
      mcpHostname = new URL(cfg.url).hostname;
    } catch {
      // Invalid URLs are skipped by the MCP client later.
    }

    const isOwnServer =
      cfg.isInternal ||
      mcpHostname === ownHostname ||
      mcpHostname === 'localhost' ||
      mcpHostname === '127.0.0.1';

    serverConfig[cfg.id] = {
      transport: isOwnServer ? 'http' : 'sse',
      url: cfg.url,
      ...(isOwnServer && { headers: { Authorization: `Bearer ${internalToken}` } }),
    };

    return serverConfig;
  }, {});
}
