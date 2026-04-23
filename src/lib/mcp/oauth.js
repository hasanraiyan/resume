import { encode, decode } from 'next-auth/jwt';
import crypto from 'crypto';

export function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function generateCode() {
  return crypto.randomBytes(32).toString('base64url');
}

export function verifyPKCE(codeVerifier, codeChallenge) {
  const computed = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return computed === codeChallenge;
}

export async function createAccessToken({ clientId, userId, scope, resource }) {
  const now = Math.floor(Date.now() / 1000);
  return encode({
    token: {
      sub: clientId,
      clientId,
      userId: userId || null,
      scope,
      resource: resource || null,
      role: 'mcp',
      iat: now,
      exp: now + 3600,
    },
    secret: process.env.NEXTAUTH_SECRET,
  });
}

export async function createRefreshToken({ clientId, userId, scope, resource }) {
  const now = Math.floor(Date.now() / 1000);
  return encode({
    token: {
      sub: clientId,
      clientId,
      userId: userId || null,
      scope,
      resource: resource || null,
      role: 'mcp_refresh',
      iat: now,
      exp: now + 7 * 24 * 3600,
    },
    secret: process.env.NEXTAUTH_SECRET,
  });
}

export async function verifyRefreshToken(token) {
  try {
    const payload = await decode({ token, secret: process.env.NEXTAUTH_SECRET });
    if (!payload || payload.role !== 'mcp_refresh') return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token) {
  try {
    const payload = await decode({ token, secret: process.env.NEXTAUTH_SECRET });
    if (!payload || payload.role !== 'mcp') return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
