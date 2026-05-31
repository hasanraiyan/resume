import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpAuthCode from '@/models/McpAuthCode';
import McpClient from '@/models/McpClient';
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

function parseServerKeyFromResource(resource) {
  if (!resource) {
    return null;
  }

  try {
    const url = new URL(resource);
    const parts = url.pathname.split('/').filter(Boolean);
    const mcpIndex = parts.findIndex((part) => part === 'mcp');

    return mcpIndex === -1 ? null : parts[mcpIndex + 1] || null;
  } catch {
    return null;
  }
}

function getCanonicalResource(params, serverKey) {
  const requestedResource = params.get('resource');

  if (requestedResource) {
    return requestedResource;
  }

  const origin = params.get('origin');
  return origin ? `${origin}/api/mcp/${serverKey}` : `/api/mcp/${serverKey}`;
}

async function getRegisteredClient(clientId) {
  if (!clientId) {
    return null;
  }

  await dbConnect();
  return McpClient.findOne({ clientId }).lean();
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

export async function getAuthorizationRequestDetails({ params }) {
  const serverKey =
    params.get('server') || parseServerKeyFromResource(params.get('resource')) || 'test';
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    throw new Error('Unknown MCP server');
  }

  const redirectUri = params.get('redirect_uri');
  const clientId = params.get('client_id');

  if (!redirectUri || !clientId) {
    throw new Error('redirect_uri and client_id are required');
  }

  const registeredClient = await getRegisteredClient(clientId);
  if (registeredClient && !registeredClient.redirectUris.includes(redirectUri)) {
    throw new Error('redirect_uri is not registered for this client');
  }

  const scopes = normalizeRequestedScopes(definition, params.get('scope'));
  const resource = getCanonicalResource(params, serverKey);

  if (scopes.length === 0) {
    throw new Error('No valid scopes requested');
  }

  return {
    serverKey,
    serverName: definition.name,
    serverDescription: definition.description,
    clientId,
    clientName:
      registeredClient?.clientName ||
      params.get('client_name') ||
      params.get('client_id') ||
      'MCP Client',
    redirectUri,
    resource,
    scopes,
    scopeDescriptions: definition.scopeDescriptions || {},
    state: params.get('state') || '',
    registeredClient: Boolean(registeredClient),
  };
}

export function createOAuthErrorRedirect({ redirectUri, state, error, description }) {
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('error', error);
  if (description) {
    redirectUrl.searchParams.set('error_description', description);
  }
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  return redirectUrl;
}

export async function createAuthorizationCode({ session, params }) {
  const details = await getAuthorizationRequestDetails({ params });
  const code = createConnectionKey('mcp_code');

  await McpAuthCode.create({
    code,
    ownerId: getSessionOwnerId(session),
    serverKey: details.serverKey,
    clientId: details.clientId,
    clientName: details.clientName,
    redirectUri: details.redirectUri,
    resource: details.resource,
    scope: details.scopes.join(' '),
    codeChallenge: params.get('code_challenge'),
    codeChallengeMethod: params.get('code_challenge_method') || 'plain',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  return {
    code,
    redirectUri: details.redirectUri,
    state: params.get('state'),
  };
}

export async function exchangeAuthorizationCode({
  code,
  redirectUri,
  clientId,
  codeVerifier,
  resource,
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

  if (resource && authCode.resource !== resource) {
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
    resource: authCode.resource,
    metadata: {
      authorizedAt: new Date().toISOString(),
      grantType: 'authorization_code',
      resource: authCode.resource,
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
