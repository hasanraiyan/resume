import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpOAuthCode from '@/models/McpOAuthCode';
import { verifyPkce } from './pkce';

const CODE_TTL_MS = 5 * 60 * 1000;

export async function createAuthorizationCode({
  clientId,
  redirectUri,
  resource,
  scope,
  codeChallenge,
  codeChallengeMethod,
  ownerId,
}) {
  await dbConnect();

  const code = crypto.randomBytes(32).toString('base64url');

  await McpOAuthCode.create({
    code,
    clientId,
    redirectUri,
    resource,
    scope,
    codeChallenge,
    codeChallengeMethod,
    ownerId,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  return code;
}

/**
 * Validates and single-use-consumes an authorization code.
 * Returns the code document on success, or null on any failure
 * (unknown code, expired, already used, client/redirect/PKCE mismatch).
 */
export async function consumeAuthorizationCode({ code, clientId, redirectUri, codeVerifier }) {
  await dbConnect();

  const doc = await McpOAuthCode.findOneAndUpdate(
    { code, consumedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );

  if (!doc) return null;
  if (doc.clientId !== clientId) return null;
  if (doc.redirectUri !== redirectUri) return null;
  if (!verifyPkce(codeVerifier, doc.codeChallenge, doc.codeChallengeMethod)) return null;

  return doc;
}
