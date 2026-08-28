import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import config from '../../config';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiError';
import httpStatus from 'http-status';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_SESSION_ID = 'csrf';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const isSecureRequest = (req: Request): boolean =>
  req.secure || req.headers['x-forwarded-proto'] === 'https' || config.env === 'production';

const generateCsrfToken = (sessionId: string): string => {
  const random = randomBytes(16).toString('hex');
  const payload = `${sessionId}.${random}`;
  const hmac = createHmac('sha256', config.csrf_secret)
    .update(payload)
    .digest('hex');
  return `${payload}.${hmac}`;
};

const verifyCsrfToken = (token: string, sessionId: string): boolean => {
  // Decode potential URL encoding from Postman/Browsers
  let decodedToken = token;

  try {
    decodedToken = decodeURIComponent(token);
  } catch {
    return false;
  }

  const parts = decodedToken.split('.');
  
  if (parts.length !== 3) return false;
  
  const [tSessionId, random, hmac] = parts;
  
  // Normalize session ID (IP) for comparison
  if (tSessionId !== sessionId) return false;

  const payload = `${tSessionId}.${random}`;
  const expectedHmac = createHmac('sha256', config.csrf_secret)
    .update(payload)
    .digest('hex');

  if (hmac.length !== expectedHmac.length) return false;

  return timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
};

const setCsrfCookie = (req: Request, res: Response, token: string) => {
  const isSecure = isSecureRequest(req);

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: isSecure ? 'none' : 'lax',
    secure: !!isSecure,
  });
};

export const createCsrfTokenForRequest = (req: Request, res: Response): string => {
  const token = generateCsrfToken(CSRF_SESSION_ID);
  setCsrfCookie(req, res, token);
  return token;
};

export const setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.includes(req.method) && !req.cookies[CSRF_COOKIE]) {
    createCsrfTokenForRequest(req, res);
  }
  next();
};

const isWhitelistedOrigin = (originHeader: string | undefined, refererHeader: string | undefined): boolean => {
  let requestOrigin = '';
  
  if (originHeader) {
    requestOrigin = originHeader.trim();
  } else if (refererHeader) {
    try {
      const url = new URL(refererHeader);
      requestOrigin = `${url.protocol}//${url.host}`;
    } catch {
      // Ignore URL parsing errors
    }
  }

  if (!requestOrigin) return false;

  // Remove trailing slashes for clean matching
  const normalizedRequestOrigin = requestOrigin.toLowerCase().replace(/\/$/, '');

  if (!config.cors_origin) {
    return true; // Fallback for dev environment without a strict CORS whitelist
  }

  const allowedOrigins = config.cors_origin.split(',').map(o => o.trim().toLowerCase().replace(/\/$/, ''));
  
  return allowedOrigins.includes(normalizedRequestOrigin);
};

export const verifyCsrf = (req: Request, _res: Response, next: NextFunction) => {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  if (config.env === 'development') {
    return next();
  }

  if (req.originalUrl.includes('/payment') || req.path.startsWith('/payment')) {
    return next();
  }

  const originHeader = req.headers.origin as string | undefined;
  const refererHeader = req.headers.referer as string | undefined;

  if (isWhitelistedOrigin(originHeader, refererHeader)) {
    return next();
  }

  const token = (req.headers[CSRF_HEADER] as string) || req.body?._csrf;

  if (!token) {
    throw new ApiError(httpStatus.FORBIDDEN, 'CSRF token missing');
  }

  if (!verifyCsrfToken(token, CSRF_SESSION_ID)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid CSRF token');
  }

  next();
};
