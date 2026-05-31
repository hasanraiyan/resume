import { NextResponse } from 'next/server';
import { buildProtectedResourceMetadata } from '@/lib/mcp/metadata';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const metadata = buildProtectedResourceMetadata({
    origin: url.origin,
    serverKey: url.searchParams.get('server'),
  });

  if (!metadata) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  return withMcpCorsHeaders(NextResponse.json(metadata));
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
