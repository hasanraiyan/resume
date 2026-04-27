import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import AppConnection from '@/models/AppConnection';

const MOBILE_TOKEN_TYPE = 'app_connection_mobile';
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

export async function verifyMobileSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.type !== MOBILE_TOKEN_TYPE || payload.role !== 'admin' || !payload.connectionId) {
      return null;
    }

    await dbConnect();
    const connection = await AppConnection.findOne({
      _id: payload.connectionId,
      ownerId: payload.ownerId || OWNER_FALLBACK,
      appKey: payload.appKey || 'pocketly',
      channel: payload.channel || 'android',
      status: 'active',
    }).lean();

    if (!connection) {
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
