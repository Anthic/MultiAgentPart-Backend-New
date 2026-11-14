import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import config from '../../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { authCookieNames } from '../constants/auth';
import { Role } from '../constants/role';
import { redis } from '../../config/redis';
import { accessBlacklistKey, userRevokedKey } from '../utils/tokenSecurity';

const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {

  let token = req.cookies?.[authCookieNames.accessToken];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  let verified;
  try {
    verified = jwtHelpers.verifyToken(
      token,
      config.jwt.access_secret as string,
    );
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has expired, please refresh');
    }
    // Do not echo jsonwebtoken internals to the client.
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  // Revocation checks (logout / deleted account). Fail CLOSED: if Redis is
  // unreachable we cannot prove the session is still valid.
  let revoked: (string | null)[];
  try {
    revoked = await redis.mget(
      accessBlacklistKey(token),
      userRevokedKey(String(verified.userId)),
    );
  } catch (error) {
    console.error('[auth] revocation check unavailable:', (error as Error).message);
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Authentication service unavailable, please retry');
  }
  if (revoked[0] || revoked[1]) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has been revoked. Please login again.');
  }

  {
    req.user = {
      userId: verified.userId as string,
      role: verified.role as Role,
      email: verified.email as string,
    };
    next();
  }
};

const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check req.user.role against allowed roles
    if (roles.length && !roles.includes(req.user?.role as string)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    next();
  };
};

export const auth = {
  authenticate,
  authorizeRoles,
  authorize: authorizeRoles, // Alias for backward compatibility
};
