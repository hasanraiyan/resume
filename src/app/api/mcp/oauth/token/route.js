import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import McpAuthCode from '@/models/McpAuthCode';
import { verifyPKCE, createAccessToken } from '@/lib/mcp/oauth';

export async function POST(request) {
  try {
    let params;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      params = Object.fromEntries(new URLSearchParams(text));
    } else {
      params = await request.json();
    }

    const { grant_type, code, redirect_uri, code_verifier, client_id } = params;

    if (grant_type !== 'authorization_code') {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }

    if (!code || !code_verifier || !client_id) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    await dbConnect();
    const authCode = await McpAuthCode.findOne({ code, clientId: client_id });

    if (!authCode) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    if (authCode.expiresAt < new Date()) {
      await McpAuthCode.deleteOne({ _id: authCode._id });
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Code expired' },
        { status: 400 }
      );
    }

    if (redirect_uri && redirect_uri !== authCode.redirectUri) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    if (!verifyPKCE(code_verifier, authCode.codeChallenge)) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'PKCE verification failed' },
        { status: 400 }
      );
    }

    // Consume the auth code (one-time use)
    await McpAuthCode.deleteOne({ _id: authCode._id });

    const accessToken = await createAccessToken({
      clientId: client_id,
      scope: authCode.scope,
      resource: authCode.resource,
    });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: authCode.scope,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
