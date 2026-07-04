import { NextResponse } from 'next/server';
import {
  createAppConnection,
  createConnectionKey,
  createMcpAccessToken,
  createMcpRefreshToken,
  verifyMcpRefreshToken,
} from '@/lib/app-connections';
import { consumeAuthorizationCode } from '@/lib/mcp/oauth/codes';
import { findOAuthClient } from '@/lib/mcp/oauth/clients';
import { resolveResourceKeyFromUrl, getMcpResourceConfig } from '@/lib/mcp/oauth/resources';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1h

async function readParams(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return new URLSearchParams(body);
  }
  const formData = await request.formData();
  return new URLSearchParams(formData);
}

function errorResponse(error, description, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

async function handleAuthorizationCodeGrant(params) {
  const code = params.get('code');
  const redirectUri = params.get('redirect_uri');
  const clientId = params.get('client_id');
  const codeVerifier = params.get('code_verifier');

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return errorResponse(
      'invalid_request',
      'code, redirect_uri, client_id, code_verifier required'
    );
  }

  const client = await findOAuthClient(clientId);
  if (!client) return errorResponse('invalid_client', 'Unknown client_id', 401);

  const codeDoc = await consumeAuthorizationCode({ code, clientId, redirectUri, codeVerifier });
  if (!codeDoc) return errorResponse('invalid_grant', 'Invalid, expired, or already-used code');

  const resourceKey = resolveResourceKeyFromUrl(codeDoc.resource);
  const resourceConfig = getMcpResourceConfig(resourceKey);
  if (!resourceConfig) return errorResponse('invalid_target', 'Unknown resource');

  const connection = await createAppConnection({
    ownerId: codeDoc.ownerId,
    appKey: resourceConfig.appKey,
    channel: 'mcp-oauth',
    connectionType: 'oauth',
    connectionKey: createConnectionKey(`mcp-oauth-${resourceKey}-${clientId}`),
    clientId,
    clientName: client.clientName,
    scope: codeDoc.scope || resourceConfig.scope,
    resource: codeDoc.resource,
  });

  const [accessToken, refreshToken] = await Promise.all([
    createMcpAccessToken(connection, `${ACCESS_TOKEN_TTL_SECONDS}s`),
    createMcpRefreshToken(connection),
  ]);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: connection.scope,
  });
}

async function handleRefreshTokenGrant(params) {
  const refreshToken = params.get('refresh_token');
  if (!refreshToken) return errorResponse('invalid_request', 'refresh_token is required');

  const result = await verifyMcpRefreshToken(refreshToken);
  if (!result) return errorResponse('invalid_grant', 'Invalid, expired, or revoked refresh_token');

  const clientId = params.get('client_id');
  if (clientId && result.connection.clientId && clientId !== result.connection.clientId) {
    return errorResponse('invalid_grant', 'client_id does not match refresh_token');
  }

  const accessToken = await createMcpAccessToken(result.connection, `${ACCESS_TOKEN_TTL_SECONDS}s`);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: result.connection.scope,
  });
}

export async function POST(request) {
  const params = await readParams(request);
  const grantType = params.get('grant_type');

  if (grantType === 'authorization_code') return handleAuthorizationCodeGrant(params);
  if (grantType === 'refresh_token') return handleRefreshTokenGrant(params);

  return errorResponse(
    'unsupported_grant_type',
    'Only authorization_code and refresh_token are supported'
  );
}
