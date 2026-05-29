import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import config from '../../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { authCookieNames } from '../constants/auth';
import { Role } from '../constants/role';

const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // 1. Read access token from cookie first
  let token = req.cookies?.[authCookieNames.accessToken];

  // 2. Fallback to Authorization header
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 3. If no token found anywhere
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  try {
    // 4. Verify token
    const verified = jwtHelpers.verifyToken(
      token,
      config.jwt.access_secret as string,
    );

    // 7. Attach decoded payload to req.user
    req.user = {
      userId: verified.userId as string,
      role: verified.role as Role,
      email: verified.email as string,
    };

    // 8. Call next()
    next();
  } catch (error: any) {
    // 5 & 6. Handle invalid or expired tokens
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Token has expired, please refresh',
      );
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
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
