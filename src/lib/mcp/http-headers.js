import { NextResponse } from 'next/server';

export const MCP_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, WWW-Authenticate',
};

export function withMcpCorsHeaders(response) {
  for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export function mcpOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: MCP_CORS_HEADERS,
  });
}
