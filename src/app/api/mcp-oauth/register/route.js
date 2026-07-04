import { NextResponse } from 'next/server';
import { registerOAuthClient } from '@/lib/mcp/oauth/clients';

// Dynamic Client Registration (RFC 7591) — public PKCE clients only.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const redirectUris = Array.isArray(body?.redirect_uris)
    ? body.redirect_uris.filter((uri) => typeof uri === 'string' && uri)
    : [];

  if (redirectUris.length === 0) {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris is required' },
      { status: 400 }
    );
  }

  const authMethod = body?.token_endpoint_auth_method || 'none';
  if (authMethod !== 'none') {
    return NextResponse.json(
      {
        error: 'invalid_client_metadata',
        error_description: 'Only the "none" (public, PKCE) token_endpoint_auth_method is supported',
      },
      { status: 400 }
    );
  }

  const client = await registerOAuthClient({
    redirectUris,
    clientName: typeof body?.client_name === 'string' ? body.client_name : undefined,
  });

  return NextResponse.json(
    {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: client.clientName,
    },
    { status: 201 }
  );
}
