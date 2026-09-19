import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import AttendaPairCode from '@/models/AttendaPairCode';
import { getRedisClient } from '@/lib/redis';
import {
  createAppConnection,
  createConnectionKey,
  createMobileSessionToken,
} from '@/lib/app-connections';

const DEFAULT_PAIR_TTL_SECONDS = 120; // 2 minutes

export function generatePairCode() {
  return `attenda_${crypto.randomBytes(16).toString('hex')}`;
}

export async function createPairingSession({
  ownerId,
  expiresInSeconds = DEFAULT_PAIR_TTL_SECONDS,
}) {
  const code = generatePairCode();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  // 1. Try to cache in Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      const payload = {
        code,
        ownerId,
        status: 'pending',
        clientName: null,
        connectionId: null,
        expiresAt: expiresAt.toISOString(),
      };
      await redis.set(`attenda:pair:${code}`, JSON.stringify(payload), {
        ex: expiresInSeconds,
      });
    }
  } catch (err) {
    console.warn('[Attenda Pairing] Redis write failed, falling back to MongoDB:', err.message);
  }

  // 2. Always persist in MongoDB (with TTL index)
  await dbConnect();
  await AttendaPairCode.create({
    code,
    ownerId,
    status: 'pending',
    expiresAt,
  });

  return {
    code,
    expiresAt,
    expiresInSeconds,
  };
}

export async function getPairingSession(code) {
  if (!code) return null;

  // 1. Try Redis first
  try {
    const redis = await getRedisClient();
    if (redis) {
      const cached = await redis.get(`attenda:pair:${code}`);
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (new Date(parsed.expiresAt) <= new Date()) {
          return { ...parsed, status: 'expired' };
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Attenda Pairing] Redis get failed, checking MongoDB:', err.message);
  }

  // 2. Fallback to MongoDB
  await dbConnect();
  const doc = await AttendaPairCode.findOne({ code }).lean();
  if (!doc) return null;

  if (new Date(doc.expiresAt) <= new Date()) {
    return { ...doc, status: 'expired' };
  }

  return doc;
}

export async function confirmPairingSession(code, { deviceName, platform, userAgent } = {}) {
  const session = await getPairingSession(code);
  if (!session) {
    return { error: 'Invalid pairing code', status: 400 };
  }

  if (session.status === 'expired' || new Date(session.expiresAt) <= new Date()) {
    return { error: 'Pairing code has expired', status: 410 };
  }

  if (session.status === 'linked') {
    return { error: 'Pairing code has already been used', status: 409 };
  }

  await dbConnect();

  // Create AppConnection in MongoDB
  const connection = await createAppConnection({
    ownerId: session.ownerId,
    appKey: 'attenda',
    channel: 'mobile',
    connectionType: 'session',
    connectionKey: createConnectionKey('attenda_mobile'),
    clientName: deviceName || 'Attenda Android Device',
    scope: 'attenda',
    metadata: {
      platform: platform || 'android',
      userAgent: userAgent || '',
      pairedAt: new Date().toISOString(),
    },
  });

  // Create 1-year mobile session JWT
  const token = await createMobileSessionToken(connection);

  const updatedSession = {
    ...session,
    status: 'linked',
    clientName: connection.clientName,
    connectionId: connection._id.toString(),
  };

  // Update in Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      const remainingSeconds = Math.max(
        10,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      );
      await redis.set(`attenda:pair:${code}`, JSON.stringify(updatedSession), {
        ex: remainingSeconds,
      });
    }
  } catch (err) {
    console.warn('[Attenda Pairing] Redis update failed:', err.message);
  }

  // Update in MongoDB
  await AttendaPairCode.findOneAndUpdate(
    { code },
    {
      $set: {
        status: 'linked',
        clientName: connection.clientName,
        connectionId: connection._id.toString(),
      },
    }
  );

  return {
    success: true,
    token,
    connection: {
      id: connection._id.toString(),
      clientName: connection.clientName,
      scope: connection.scope,
      createdAt: connection.createdAt,
    },
    ownerId: session.ownerId,
  };
}
