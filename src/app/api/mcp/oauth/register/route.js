import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpClient from '@/models/McpClient';

export async function POST(request) {
  try {
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
