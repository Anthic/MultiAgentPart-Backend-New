import { createHash, timingSafeEqual } from 'crypto';

// Refresh tokens are 160+ char JWTs. bcrypt only reads the first 72 bytes, and
// every JWT for the same alg/user shares that prefix, so bcrypt.compare()
// matched OLD refresh tokens too and reuse detection never fired. A SHA-256
// digest covers the whole token (and each token now carries a unique jti).
export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const safeEqualHex = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

export const accessBlacklistKey = (accessToken: string): string =>
  `token_blacklist:${sha256(accessToken)}`;

// Set when an account is deleted/disabled so already-issued access tokens stop
// working immediately instead of living out their full expiry.
export const userRevokedKey = (userId: string): string => `user_revoked:${userId}`;
