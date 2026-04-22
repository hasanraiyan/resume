const fs = require('fs');
const content = `import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import McpClient from '@/models/McpClient';
import McpAuthCode from '@/models/McpAuthCode';
import { getBaseUrl } from '@/lib/mcp/oauth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: validate params, store pending auth state in cookie, redirect to login page
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope') || 'pocketly';
  const resource = searchParams.get('resource') || null;

  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 });
  }

  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'PKCE S256 required' },
      { status: 400 }
    );
  }

  await dbConnect();
  const client = await McpClient.findOne({ clientId }).lean();
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  if (redirectUri && !client.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  }

  const pendingState = JSON.stringify({
    clientId,
    redirectUri: redirectUri || client.redirectUris[0],
    codeChallenge,
    state,
    scope,
    resource,
  });

  const cookieStore = await cookies();
  cookieStore.set('mcp_pending_auth', pendingState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'admin') {
    return NextResponse.redirect(\`\${getBaseUrl()}/mcp-authorize\`);
  }

  return NextResponse.redirect(\`\${getBaseUrl()}/login?flow=mcp\`);
}

// POST: called by the consent page to authorize or decline
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();
    const pendingRaw = cookieStore.get('mcp_pending_auth')?.value;
    if (!pendingRaw) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'No pending auth' },
        { status: 400 }
      );
    }

    const pending = JSON.parse(pendingRaw);
    cookieStore.delete('mcp_pending_auth');

    if (action === 'decline') {
      const callbackUrl = new URL(pending.redirectUri);
      callbackUrl.searchParams.set('error', 'access_denied');
      if (pending.state) callbackUrl.searchParams.set('state', pending.state);
      return NextResponse.json({ redirectTo: callbackUrl.toString() });
    }

    await dbConnect();
    const code = crypto.randomBytes(32).toString('base64url');
    await McpAuthCode.create({
      code,
      clientId: pending.clientId,
      redirectUri: pending.redirectUri,
      codeChallenge: pending.codeChallenge,
      codeChallengeMethod: 'S256',
      scope: pending.scope,
      state: pending.state || null,
      resource: pending.resource || null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const callbackUrl = new URL(pending.redirectUri);
    callbackUrl.searchParams.set('code', code);
    if (pending.state) callbackUrl.searchParams.set('state', pending.state);

    return NextResponse.json({ redirectTo: callbackUrl.toString() });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
`;
fs.writeFileSync('src/app/api/mcp/oauth/authorize/route.js', content);
