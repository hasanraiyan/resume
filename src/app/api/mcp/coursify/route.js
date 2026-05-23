import { handleMcpHttpRequest } from '@/lib/mcp/mcp-handler';
import { createCoursifyMcpServer } from '@/lib/mcp/coursify';

async function handleRequest(request) {
  return handleMcpHttpRequest({
    request,
    scope: 'coursify',
    createMcpServer: createCoursifyMcpServer,
    realmPath: '/api/mcp/coursify',
  });
}

export const POST = handleRequest;
export const GET = handleRequest;
export const DELETE = handleRequest;
