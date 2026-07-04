import crypto from 'crypto';

export function verifyPkce(codeVerifier, codeChallenge, codeChallengeMethod = 'S256') {
  if (!codeVerifier || !codeChallenge) return false;
  if (codeChallengeMethod !== 'S256') return false;

  const computed = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const computedBuf = Buffer.from(computed);
  const challengeBuf = Buffer.from(codeChallenge);

  if (computedBuf.length !== challengeBuf.length) return false;

  return crypto.timingSafeEqual(computedBuf, challengeBuf);
}
