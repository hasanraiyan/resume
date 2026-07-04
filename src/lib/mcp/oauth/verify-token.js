import { verifyMcpAccessToken } from '@/lib/app-connections';
import { getMcpResourceConfig } from './resources';

/**
 * Builds a `verifyToken` function for `withMcpAuth` (mcp-handler) that accepts
 * an OAuth access token issued by the shared `/api/mcp-oauth` authorization
 * server. Also checks the `auth`/`token` query params for clients that can't
 * send a custom Authorization header.
 */
export function createMcpTokenVerifier(resourceKey) {
  const resourceConfig = getMcpResourceConfig(resourceKey);
  if (!resourceConfig) {
    throw new Error(`Unknown MCP OAuth resource key: ${resourceKey}`);
  }

  return async function verifyToken(request, bearerToken) {
    let token = bearerToken;

    if (!token) {
      try {
        const url = new URL(request.url);
        token = url.searchParams.get('auth') || url.searchParams.get('token') || undefined;
      } catch {
        // ignore malformed URL
      }
    }

    if (!token) return undefined;

    const result = await verifyMcpAccessToken(token, { appKey: resourceConfig.appKey });
    if (!result) return undefined;

    return {
      token,
      clientId: result.connection.clientId || result.connection._id.toString(),
      scopes: [resourceConfig.scope],
      expiresAt: result.payload.exp,
    };
  };
}
