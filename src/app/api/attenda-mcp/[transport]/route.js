import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerAttendaMcp } from '@/lib/mcp/attenda/register';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * API key verification for Attenda MCP.
 * Checks auth in this order:
 *   1. Bearer token from Authorization header (Claude Desktop, Cursor)
 *   2. `auth` query parameter — e.g. ?auth=YOUR_KEY  (ChatGPT apps, URL-only clients)
 *   3. `token` query parameter — e.g. ?token=YOUR_KEY (alternative)
 */
async function verifyToken(request, bearerToken) {
  const apiKey = process.env.ATTENDA_MCP_API_KEY;
  if (!apiKey) {
    console.error('ATTENDA_MCP_API_KEY is not configured');
    return undefined;
  }

  // 1. Check Authorization header (Bearer token)
  if (bearerToken === apiKey) {
    return { token: bearerToken, clientId: 'attenda-mcp-client' };
  }

  // 2. Check query parameters (for clients that can't send custom headers)
  try {
    const url = new URL(request.url);
    const queryAuth = url.searchParams.get('auth') || url.searchParams.get('token');
    if (queryAuth === apiKey) {
      return { token: queryAuth, clientId: 'attenda-mcp-client', source: 'query' };
    }
  } catch {
    // Ignore URL parsing errors
  }

  return undefined;
}

const handler = createMcpHandler(
  (server) => {
    registerAttendaMcp(server);
  },
  {
    serverInfo: {
      name: 'attenda-mcp',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api/attenda-mcp',
    maxDuration: 60,
    disableSse: true,
  }
);

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
});

export { authHandler as GET, authHandler as POST };
