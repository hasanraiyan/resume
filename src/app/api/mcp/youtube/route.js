import { handleMcpHttpRequest } from '@/lib/mcp/mcp-handler';
import { createYoutubeMcpServer } from '@/lib/mcp/youtube';

async function handleRequest(request) {
  return handleMcpHttpRequest({
    request,
    scope: 'youtube',
    createMcpServer: createYoutubeMcpServer,
    realmPath: '/api/mcp/youtube',
  });
}

export const POST = handleRequest;
export const GET = handleRequest;
export const DELETE = handleRequest;
