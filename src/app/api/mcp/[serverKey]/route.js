import { NextResponse } from 'next/server';
import { getMcpServerDefinition } from '@/lib/mcp/factory';
import { handleMcpStreamableHttp, unauthorizedMcpResponse } from '@/lib/mcp/http';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { serverKey } = await params;
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  if (!request.headers.get('Authorization')) {
    return unauthorizedMcpResponse(serverKey, request);
  }

  return handleMcpStreamableHttp({ request, serverKey });
}

export async function POST(request, { params }) {
  const { serverKey } = await params;
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  return handleMcpStreamableHttp({ request, serverKey });
}

export async function DELETE(request, { params }) {
  const { serverKey } = await params;
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  return handleMcpStreamableHttp({ request, serverKey });
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
