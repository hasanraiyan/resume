import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerPocketlyMcp } from '@/lib/mcp/pocketly/register';
import { createMcpTokenVerifier } from '@/lib/mcp/oauth/verify-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Auth for Pocketly MCP: OAuth 2.1 + PKCE access tokens issued by the shared
 * authorization server at /api/mcp-oauth. No static API key fallback.
 */
const verifyToken = createMcpTokenVerifier('pocketly-mcp');

const handler = createMcpHandler(
  (server) => {
    registerPocketlyMcp(server);
  },
  {
    serverInfo: {
      name: 'pocketly-mcp',
      version: '0.1.0',
    },
  },
  {
    basePath: '/api/pocketly-mcp',
    maxDuration: 60,
    disableSse: true,
  }
);

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource/api/pocketly-mcp',
});

export { authHandler as GET, authHandler as POST };
