import { handleMcpHttpRequest } from '@/lib/mcp/mcp-handler';
import { createSnaplinksMcpServer } from '@/lib/mcp/snaplinks';

async function handleRequest(request) {
  return handleMcpHttpRequest({
    request,
    scope: 'snaplinks',
    createMcpServer: createSnaplinksMcpServer,
    realmPath: '/api/mcp/snaplinks',
  });
}

export const POST = handleRequest;
export const GET = handleRequest;
export const DELETE = handleRequest;
