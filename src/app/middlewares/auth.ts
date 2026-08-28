import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import config from '../../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { authCookieNames } from '../constants/auth';
import { Role } from '../constants/role';
import { redis } from '../../config/redis';

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
  try {
 
    const isBlacklisted = await redis.get(`token_blacklist:${token}`);
    if (isBlacklisted) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Session has been revoked. Please login again.');
    }
 
    const verified = jwtHelpers.verifyToken(
      token,
      config.jwt.access_secret as string,
    );
 
    req.user = {
      userId: verified.userId as string,
      role: verified.role as Role,
      email: verified.email as string,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has expired, please refresh');
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message || 'Invalid token');
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
