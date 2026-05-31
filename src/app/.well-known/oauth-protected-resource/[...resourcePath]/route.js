import { NextResponse } from 'next/server';
import {
  buildProtectedResourceMetadata,
  getServerKeyFromProtectedResourcePath,
} from '@/lib/mcp/metadata';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { resourcePath } = await params;
  const url = new URL(request.url);
  const serverKey = getServerKeyFromProtectedResourcePath(resourcePath);
  const metadata = buildProtectedResourceMetadata({
    origin: url.origin,
    serverKey,
  });

  if (!metadata) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  return withMcpCorsHeaders(NextResponse.json(metadata));
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
