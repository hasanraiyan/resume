import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpAuthCode from '@/models/McpAuthCode';
import {
  createAppConnection,
  createAppConnectionAccessToken,
  createConnectionKey,
  getSessionOwnerId,
  normalizeScopes,
  revokeAppConnection,
  verifyAppConnectionToken,
} from '@/lib/app-connections';
import { getMcpServerDefinition } from './factory';

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function normalizeRequestedScopes(definition, rawScope) {
  const requested = normalizeScopes(rawScope);
  const supported = new Set(definition.supportedScopes || []);
  const defaults = definition.defaultScopes || [];
  const scopes = requested.length > 0 ? requested : defaults;

  return scopes.filter((scope) => supported.has(scope));
}

export function verifyPkce({ verifier, challenge, method }) {
  if (!challenge) {
    return true;
  }

  if (!verifier) {
    return false;
  }

  if (method === 'S256') {
    return base64Url(crypto.createHash('sha256').update(verifier).digest()) === challenge;
  }

  return verifier === challenge;
}

export async function createAuthorizationCode({ session, params }) {
  const serverKey = params.get('server') || params.get('resource')?.split('/').pop() || 'test';
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    throw new Error('Unknown MCP server');
  }

  const redirectUri = params.get('redirect_uri');
  const clientId = params.get('client_id');

  if (!redirectUri || !clientId) {
    throw new Error('redirect_uri and client_id are required');
  }

  const scope = normalizeRequestedScopes(definition, params.get('scope')).join(' ');
  const code = createConnectionKey('mcp_code');

  await dbConnect();
  await McpAuthCode.create({
    code,
    ownerId: getSessionOwnerId(session),
    serverKey,
    clientId,
    clientName: params.get('client_name') || params.get('client_id') || 'MCP Client',
    redirectUri,
    scope,
    codeChallenge: params.get('code_challenge'),
    codeChallengeMethod: params.get('code_challenge_method') || 'plain',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  return {
    code,
    redirectUri,
    state: params.get('state'),
  };
}

export async function exchangeAuthorizationCode({
  code,
  redirectUri,
  clientId,
  codeVerifier,
  clientName = 'MCP Client',
}) {
  await dbConnect();
  const authCode = await McpAuthCode.findOne({
    code,
    clientId,
    redirectUri,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!authCode) {
    return null;
  }

  if (
    !verifyPkce({
      verifier: codeVerifier,
      challenge: authCode.codeChallenge,
      method: authCode.codeChallengeMethod,
    })
  ) {
    return null;
  }

  authCode.usedAt = new Date();
  await authCode.save();

  const connection = await createAppConnection({
    ownerId: authCode.ownerId,
    appKey: authCode.serverKey,
    channel: 'mcp',
    connectionType: 'oauth',
    connectionKey: createConnectionKey('mcp'),
    clientId,
    clientName: authCode.clientName || clientName,
    scope: authCode.scope,
    resource: `/api/mcp/${authCode.serverKey}`,
    metadata: {
      authorizedAt: new Date().toISOString(),
      grantType: 'authorization_code',
    },
  });

  const accessToken = await createAppConnectionAccessToken(connection);

  return {
    accessToken,
    scope: connection.scope,
    connection,
  };
}

export async function revokeAccessToken(token) {
  const auth = await verifyAppConnectionToken(token);
  if (!auth) {
    return false;
  }

  await revokeAppConnection({
    ownerId: auth.ownerId,
    connectionId: auth.connection._id,
  });

  return true;
}
