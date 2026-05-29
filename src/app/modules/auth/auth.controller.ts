import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import {
  IRefreshTokenResponse,
  IRegisterUser,
} from './auth.interface';
import config from '../../../config';
import { authCookieNames } from '../../constants/auth';
import ApiError from '../../errors/ApiError';
const getAccessCookieOptions = (req: Request) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config.env === 'production';
  return {
    httpOnly: true,
    secure: !!isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    domain: config.cookie.domain || undefined,
    maxAge: 15 * 60 * 1000,
  };
};

const getRefreshCookieOptions = (req: Request) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config.env === 'production';
  return {
    httpOnly: true,
    secure: !!isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    domain: config.cookie.domain || undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const getClearCookieOptions = (req: Request) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config.env === 'production';
  return {
    httpOnly: true,
    secure: !!isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    domain: config.cookie.domain || undefined,
  };
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { ...registerData } = req.body as IRegisterUser;
  const result = await AuthService.registerUser(registerData);

  res.cookie(authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
  res.cookie(
    authCookieNames.refreshToken,
    result.refreshToken,
    getRefreshCookieOptions(req),
  );

  sendResponse<any>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Account created successfully',
    data: { 
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUser(loginData);

  res.cookie(authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
  res.cookie(
    authCookieNames.refreshToken,
    result.refreshToken,
    getRefreshCookieOptions(req),
  );

  sendResponse<any>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged in successfully',
    data: { 
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  let token = req.cookies?.[authCookieNames.refreshToken];

  // Secure fallback for cross-origin environments where httpOnly cookies might be blocked
  if (!token && req.headers['x-refresh-token']) {
    token = req.headers['x-refresh-token'] as string;
  }
  if (!token && req.body?.refreshToken) {
    token = req.body.refreshToken as string;
  }

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token missing');
  }

  const result = await AuthService.refreshToken(token);

  // Set both cookies due to rotation
  res.cookie(authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
  res.cookie(
    authCookieNames.refreshToken,
    result.refreshToken,
    getRefreshCookieOptions(req),
  );

  sendResponse<IRefreshTokenResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tokens rotated successfully',
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.userId) {
    await AuthService.logoutUser(req.user.userId);
  }

  res.clearCookie(authCookieNames.accessToken, getClearCookieOptions(req));
  res.clearCookie(authCookieNames.refreshToken, getClearCookieOptions(req));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
};
