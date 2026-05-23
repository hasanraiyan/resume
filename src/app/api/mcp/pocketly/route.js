import { handleMcpHttpRequest } from '@/lib/mcp/mcp-handler';
import { createMcpServer } from '@/lib/mcp/pocketly';

async function handleRequest(request) {
  return handleMcpHttpRequest({
    request,
    scope: 'pocketly',
    createMcpServer: createMcpServer,
    realmPath: '/api/mcp/pocketly',
  });
}

export const POST = handleRequest;
export const GET = handleRequest;
export const DELETE = handleRequest;
