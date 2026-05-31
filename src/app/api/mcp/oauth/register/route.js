import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import { getAllSupportedScopes } from '@/lib/mcp/factory';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';
import McpClient from '@/models/McpClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const now = Math.floor(Date.now() / 1000);
  const clientId = `mcp-client-${crypto.randomBytes(16).toString('base64url')}`;
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  const grantTypes = Array.isArray(body.grant_types) ? body.grant_types : ['authorization_code'];
  const responseTypes = Array.isArray(body.response_types) ? body.response_types : ['code'];
  const tokenEndpointAuthMethod = body.token_endpoint_auth_method || 'none';
  const scope = body.scope || getAllSupportedScopes().join(' ');

  if (!redirectUris.length) {
    return withMcpCorsHeaders(
      NextResponse.json(
        { error: 'invalid_redirect_uri', error_description: 'redirect_uris is required.' },
        { status: 400 }
      )
    );
  }

  if (!grantTypes.includes('authorization_code') || !responseTypes.includes('code')) {
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          error: 'invalid_client_metadata',
          error_description: 'Only authorization_code/code clients are supported.',
        },
        { status: 400 }
      )
    );
  }

  if (tokenEndpointAuthMethod !== 'none') {
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          error: 'invalid_client_metadata',
          error_description:
            'Only public PKCE clients with token_endpoint_auth_method none are supported.',
        },
        { status: 400 }
      )
    );
  }

  await dbConnect();
  await McpClient.create({
    clientId,
    clientName: body.client_name || 'MCP Client',
    redirectUris,
    grantTypes,
    responseTypes,
    scope,
    tokenEndpointAuthMethod,
    metadata: body,
  });

  return withMcpCorsHeaders(
    NextResponse.json(
      {
        client_id: clientId,
        client_id_issued_at: now,
        client_name: body.client_name || 'MCP Client',
        redirect_uris: redirectUris,
        grant_types: grantTypes,
        response_types: responseTypes,
        token_endpoint_auth_method: tokenEndpointAuthMethod,
        scope,
        application_type: body.application_type || 'web',
      },
      { status: 201 }
    )
  );
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
