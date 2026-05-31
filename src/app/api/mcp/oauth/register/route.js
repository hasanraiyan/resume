import { NextResponse } from 'next/server';
import { createConnectionKey } from '@/lib/app-connections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json(
    {
      client_id: createConnectionKey('mcp_client'),
      client_name: body.client_name || 'MCP Client',
      redirect_uris: body.redirect_uris || [],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    { status: 201 }
  );
}
