import { NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/mcp/oauth';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const form = await request.formData();
  const grantType = form.get('grant_type');

  if (grantType !== 'authorization_code') {
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code is supported.',
        },
        { status: 400 }
      )
    );
  }

  const token = await exchangeAuthorizationCode({
    code: form.get('code'),
    redirectUri: form.get('redirect_uri'),
    clientId: form.get('client_id'),
    codeVerifier: form.get('code_verifier'),
    resource: form.get('resource'),
    clientName: form.get('client_name') || 'MCP Client',
  });

  if (!token) {
    return withMcpCorsHeaders(
      NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code is invalid or expired.' },
        { status: 400 }
      )
    );
  }

  return withMcpCorsHeaders(
    NextResponse.json({
      access_token: token.accessToken,
      token_type: 'Bearer',
      expires_in: 90 * 24 * 60 * 60,
      scope: token.scope,
    })
  );
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
