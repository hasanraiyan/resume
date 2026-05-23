import { handleMcpHttpRequest } from '@/lib/mcp/mcp-handler';
import { createMcpServer } from '@/lib/mcp/recall';

async function handleRequest(request) {
  return handleMcpHttpRequest({
    request,
    scope: 'recall',
    createMcpServer: createMcpServer,
    realmPath: '/api/mcp/recall',
  });
}

export const POST = handleRequest;
export const GET = handleRequest;
export const DELETE = handleRequest;
