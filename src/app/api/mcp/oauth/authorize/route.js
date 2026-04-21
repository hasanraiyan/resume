import { NextResponse } from 'next/server';
import crypto, { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { OTP } from 'otplib';
import dbConnect from '@/lib/dbConnect';
import McpClient from '@/models/McpClient';
import McpAuthCode from '@/models/McpAuthCode';
import { getBaseUrl } from '@/lib/mcp/oauth';

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

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

  return NextResponse.redirect(`${getBaseUrl()}/login?flow=mcp`);
}

// POST: called by the login page after admin credentials verified
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, token } = body;

    if (
      !username ||
      !password ||
      !safeEqual(username, process.env.ADMIN_USERNAME) ||
      !safeEqual(password, process.env.ADMIN_PASSWORD)
    ) {
      return NextResponse.json({ error: 'access_denied' }, { status: 401 });
    }

    if (process.env.TOTP_SECRET) {
      const otp = new OTP();
      const isValid = otp.verifySync({
        token: token || '',
        secret: process.env.TOTP_SECRET,
      });
      if (!isValid.valid) {
        return NextResponse.json(
          { error: 'invalid_otp', error_description: 'Invalid 2FA code' },
          { status: 401 }
        );
      }
    }

    const cookieStore = await cookies();
    const pendingRaw = cookieStore.get('mcp_pending_auth')?.value;
    if (!pendingRaw) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'No pending auth' },
        { status: 400 }
      );
    }

    const pending = JSON.parse(pendingRaw);

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

    cookieStore.delete('mcp_pending_auth');

    const callbackUrl = new URL(pending.redirectUri);
    callbackUrl.searchParams.set('code', code);
    if (pending.state) callbackUrl.searchParams.set('state', pending.state);

    return NextResponse.json({ redirectTo: callbackUrl.toString() });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
