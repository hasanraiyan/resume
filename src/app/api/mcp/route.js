import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { verifyAccessToken, getBaseUrl } from '@/lib/mcp/oauth';
import { createMcpServer } from '@/lib/mcp/server';

function unauthorizedResponse(description) {
  const base = getBaseUrl();
  return new Response(JSON.stringify({ error: 'unauthorized', error_description: description }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="${base}/api/mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
    },
  });
}

async function getAuthInfo(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return {
    token,
    clientId: payload.clientId,
    scopes: (payload.scope || '').split(' ').filter(Boolean),
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
  };
}

async function handleMcpRequest(request) {
  const authInfo = await getAuthInfo(request);
  if (!authInfo) return unauthorizedResponse('Valid Bearer token required');

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(request, { authInfo });
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
