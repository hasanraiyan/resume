import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import McpAuthCode from '@/models/McpAuthCode';
import AppConnection from '@/models/AppConnection';
import {
  verifyPKCE,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '@/lib/mcp/oauth';

async function parseParams(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  }
  return request.json();
}

async function handleAuthorizationCode(params) {
  const { code, redirect_uri, code_verifier, client_id } = params;

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

  await McpAuthCode.deleteOne({ _id: authCode._id });

  const connection = await AppConnection.findOne({
    _id: authCode.connectionId,
    ownerId: authCode.ownerId,
    status: 'active',
  }).lean();
  if (!connection) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Connection revoked' },
      { status: 400 }
    );
  }

  const tokenPayload = {
    clientId: client_id,
    ownerId: authCode.ownerId,
    connectionId: authCode.connectionId,
    scope: authCode.scope,
    resource: authCode.resource,
  };

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(tokenPayload),
    createRefreshToken(tokenPayload),
  ]);

  return NextResponse.json(
    {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authCode.scope,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

async function handleRefreshToken(params) {
  const { refresh_token, client_id } = params;

  if (!refresh_token) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'refresh_token is required' },
      { status: 400 }
    );
  }

  const payload = await verifyRefreshToken(refresh_token);
  if (!payload) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' },
      { status: 400 }
    );
  }

  if (client_id && client_id !== payload.clientId) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'client_id mismatch' },
      { status: 400 }
    );
  }

  await dbConnect();
  const connection = await AppConnection.findOne({
    _id: payload.connectionId,
    ownerId: payload.ownerId,
    status: 'active',
  }).lean();
  if (!connection) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Connection revoked' },
      { status: 400 }
    );
  }

  const tokenPayload = {
    clientId: payload.clientId,
    ownerId: payload.ownerId || null,
    connectionId: payload.connectionId || null,
    scope: payload.scope,
    resource: payload.resource,
  };

  const [accessToken, newRefreshToken] = await Promise.all([
    createAccessToken(tokenPayload),
    createRefreshToken(tokenPayload),
  ]);

  return NextResponse.json(
    {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: payload.scope,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request) {
  try {
    const params = await parseParams(request);

    if (params.grant_type === 'authorization_code') {
      return handleAuthorizationCode(params);
    }

    if (params.grant_type === 'refresh_token') {
      return handleRefreshToken(params);
    }

    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
