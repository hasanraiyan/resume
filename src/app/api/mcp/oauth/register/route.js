import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpClient from '@/models/McpClient';

const rateLimit = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'too_many_requests', error_description: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const body = await request.json();
    await dbConnect();

    const clientId = `mcp_${crypto.randomBytes(16).toString('hex')}`;

    const client = await McpClient.create({
      clientId,
      clientName: body.client_name || 'MCP Client',
      redirectUris: body.redirect_uris || [],
      grantTypes: body.grant_types || ['authorization_code'],
      responseTypes: body.response_types || ['code'],
      tokenEndpointAuthMethod: body.token_endpoint_auth_method || 'none',
      scope: body.scope || 'pocketly',
    });

    return NextResponse.json(
      {
        client_id: client.clientId,
        client_name: client.clientName,
        redirect_uris: client.redirectUris,
        grant_types: client.grantTypes,
        response_types: client.responseTypes,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
        scope: client.scope,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
