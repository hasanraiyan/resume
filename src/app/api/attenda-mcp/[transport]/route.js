import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerAttendaMcp } from '@/lib/mcp/attenda/register';
import { createMcpTokenVerifier } from '@/lib/mcp/oauth/verify-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Auth for Attenda MCP: OAuth 2.1 + PKCE access tokens issued by the shared
 * authorization server at /api/mcp-oauth. No static API key fallback.
 */
const verifyToken = createMcpTokenVerifier('attenda-mcp');

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
  resourceMetadataPath: '/.well-known/oauth-protected-resource/api/attenda-mcp',
});

export { authHandler as GET, authHandler as POST };
