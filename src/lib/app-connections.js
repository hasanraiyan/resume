import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import AppConnection from '@/models/AppConnection';

const MOBILE_TOKEN_TYPE = 'app_connection_mobile';
const ACCESS_TOKEN_TYPE = 'app_connection_access';
const MCP_ACCESS_TOKEN_TYPE = 'app_connection_mcp_access';
const MCP_REFRESH_TOKEN_TYPE = 'app_connection_mcp_refresh';
const OWNER_FALLBACK = 'admin';

function getJwtSecret() {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
}

export function getSessionOwnerId(session) {
  return session?.user?.id || session?.user?.email || OWNER_FALLBACK;
}

export function createConnectionKey(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

export function normalizeScopes(scope = '') {
  if (Array.isArray(scope)) {
    return [...new Set(scope.map((item) => String(item).trim()).filter(Boolean))];
  }

  return [
    ...new Set(
      String(scope || '')
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

export function hasRequiredScopes(grantedScope = '', requiredScopes = []) {
  const granted = new Set(normalizeScopes(grantedScope));
  return requiredScopes.every((scope) => granted.has(scope));
}

export async function createAppConnection({
  ownerId,
  appKey,
  channel,
  connectionType = 'session',
  connectionKey,
  clientId = null,
  clientName,
  scope = '',
  resource = null,
  metadata = {},
}) {
  await dbConnect();

  return AppConnection.findOneAndUpdate(
    { ownerId, connectionKey },
    {
      $set: {
        appKey,
        channel,
        connectionType,
        clientId,
        clientName,
        scope,
        resource,
        status: 'active',
        revokedAt: null,
        metadata,
      },
      $setOnInsert: {
        lastUsedAt: null,
      },
    },
    { upsert: true, new: true }
  );
}

export async function revokeAppConnection({ ownerId, connectionId }) {
  await dbConnect();

  return AppConnection.findOneAndUpdate(
    { _id: connectionId, ownerId, status: 'active' },
    {
      $set: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    },
    { new: true }
  );
}

export async function revokeAppConnectionsByFilter({ ownerId, filter = {} }) {
  await dbConnect();

  const match = {
    ownerId,
    status: 'active',
    ...filter,
  };

  const result = await AppConnection.updateMany(match, {
    $set: {
      status: 'revoked',
      revokedAt: new Date(),
    },
  });

  return result.modifiedCount || 0;
}

export async function listAppConnections(ownerId) {
  await dbConnect();
  return AppConnection.find({ ownerId, status: 'active' })
    .sort({ lastUsedAt: -1, createdAt: -1 })
    .lean();
}

export async function markConnectionUsed(connectionId) {
  await dbConnect();
  return AppConnection.findByIdAndUpdate(connectionId, { $set: { lastUsedAt: new Date() } });
}

export async function createMobileSessionToken(connection) {
  return new SignJWT({
    role: 'admin',
    type: MOBILE_TOKEN_TYPE,
    ownerId: connection.ownerId,
    connectionId: connection._id.toString(),
    appKey: connection.appKey,
    channel: connection.channel,
    scope: connection.scope,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')
    .sign(getJwtSecret());
}

export async function createAppConnectionAccessToken(connection, expiresIn = '90d') {
  return new SignJWT({
    role: 'admin',
    type: ACCESS_TOKEN_TYPE,
    ownerId: connection.ownerId,
    connectionId: connection._id.toString(),
    appKey: connection.appKey,
    channel: connection.channel,
    scope: connection.scope,
    clientId: connection.clientId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyAppConnectionToken(token, options = {}) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const allowedTypes = options.allowedTypes || [MOBILE_TOKEN_TYPE, ACCESS_TOKEN_TYPE];

    if (!allowedTypes.includes(payload.type) || payload.role !== 'admin' || !payload.connectionId) {
      return null;
    }

    await dbConnect();
    const match = {
      _id: payload.connectionId,
      ownerId: payload.ownerId || OWNER_FALLBACK,
      status: 'active',
    };

    if (options.appKey || payload.appKey) {
      match.appKey = options.appKey || payload.appKey;
    }

    if (options.channel || payload.channel) {
      match.channel = options.channel || payload.channel;
    }

    const connection = await AppConnection.findOne(match).lean();

    if (!connection) {
      return null;
    }

    if (options.requiredScopes && !hasRequiredScopes(connection.scope, options.requiredScopes)) {
      return null;
    }

    return {
      ownerId: connection.ownerId,
      connection,
      payload,
    };
  } catch {
    return null;
  }
}

export async function verifyMobileSessionToken(token) {
  return verifyAppConnectionToken(token, { allowedTypes: [MOBILE_TOKEN_TYPE] });
}

export async function createMcpAccessToken(connection, expiresIn = '1h') {
  return new SignJWT({
    role: 'admin',
    type: MCP_ACCESS_TOKEN_TYPE,
    ownerId: connection.ownerId,
    connectionId: connection._id.toString(),
    appKey: connection.appKey,
    scope: connection.scope,
    resource: connection.resource,
    clientId: connection.clientId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function createMcpRefreshToken(connection, expiresIn = '30d') {
  return new SignJWT({
    role: 'admin',
    type: MCP_REFRESH_TOKEN_TYPE,
    ownerId: connection.ownerId,
    connectionId: connection._id.toString(),
    appKey: connection.appKey,
    clientId: connection.clientId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyMcpAccessToken(token, options = {}) {
  return verifyAppConnectionToken(token, { ...options, allowedTypes: [MCP_ACCESS_TOKEN_TYPE] });
}

export async function verifyMcpRefreshToken(token, options = {}) {
  return verifyAppConnectionToken(token, { ...options, allowedTypes: [MCP_REFRESH_TOKEN_TYPE] });
}
