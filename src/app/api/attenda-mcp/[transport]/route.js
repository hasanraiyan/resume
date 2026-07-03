import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerAttendaMcp } from '@/lib/mcp/attenda/register';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * API key verification for Attenda MCP.
 * Reads the bearer token from the Authorization header and compares
 * it against the ATTENDA_MCP_API_KEY environment variable.
 */
async function verifyToken(request, bearerToken) {
  if (!bearerToken) {
    // Allow requests that already have a valid NextAuth session (web app use)
    // but require the API key for external MCP clients
    return undefined;
  }

  const apiKey = process.env.ATTENDA_MCP_API_KEY;
  if (!apiKey) {
    console.error('ATTENDA_MCP_API_KEY is not configured');
    return undefined;
  }

  if (bearerToken === apiKey) {
    return { token: bearerToken, clientId: 'attenda-mcp-client' };
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
