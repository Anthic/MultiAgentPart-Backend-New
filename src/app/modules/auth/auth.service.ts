import mongoose from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { redis } from '../../../config/redis';
import { accessBlacklistKey, safeEqualHex, sha256 } from '../../utils/tokenSecurity';
import ApiError from '../../errors/ApiError';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { SignOptions } from 'jsonwebtoken';
import { AuthUser } from './auth.model';
import { User } from '../user/user.model';
import {
  ILoginUser,
  ILoginUserServiceResponse,
  IRefreshTokenResponse,
  IRegisterUser,
} from './auth.interface';
import config from '../../../config';
import { validatePasswordComplexity } from '../../utils/passwordUtils';


// Compared against when the email is unknown so a missing account costs the
// same bcrypt time as a wrong password (no timing-based user enumeration).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
const INVALID_LOGIN = 'Invalid email or password';

const createTokens = (payload: {
  userId: string;
  role: string;
  email: string;
}): { accessToken: string; refreshToken: string } => {
  const accessToken = jwtHelpers.createToken(
    payload,
    config.jwt.access_secret as string,
    (config.jwt.access_expires_in || '15m') as SignOptions['expiresIn'],
  );

  // jti makes every refresh token unique, even two issued in the same second.
  const refreshToken = jwtHelpers.createToken(
    { ...payload, jti: randomUUID() },
    config.jwt.refresh_secret as string,
    (config.jwt.refresh_expires_in || '7d') as SignOptions['expiresIn'],
  );

  return { accessToken, refreshToken };
};

const registerUser = async (
  payload: IRegisterUser,
): Promise<ILoginUserServiceResponse> => {
  const { name, password } = payload;
  const email = String(payload.email).trim().toLowerCase();

  // Password Complexity Check
  const { isValid, errors } = validatePasswordComplexity(password);
  if (!isValid) throw new ApiError(httpStatus.BAD_REQUEST, errors.join(', '));

  const existingUser = await AuthUser.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'User already exists');
  }

  const userId = randomUUID();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authUser = await AuthUser.create(
      [{ userId, email, password, role: 'user' }],
      { session },
    );

    // Store in password history
    await AuthUser.findByIdAndUpdate(
      authUser[0]._id,
      { $push: { passwordHistory: authUser[0].password } },
      { session },
    );

    await User.create(
      [{ id: userId, name, email, role: authUser[0].role }],
      { session },
    );

    await session.commitTransaction();

    const tokens = createTokens({
      userId: authUser[0].userId,
      role: authUser[0].role,
      email: authUser[0].email,
    });

    return {
      ...tokens,
      user: {
        userId: authUser[0].userId,
        name,
        email: authUser[0].email,
        role: authUser[0].role as 'admin' | 'user',
      },
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const loginUser = async (
  payload: ILoginUser,
): Promise<ILoginUserServiceResponse> => {
  const { password } = payload;
  const email = String(payload.email).trim().toLowerCase();

  const authUser = await AuthUser.findOne({ email }).select(
    '+password +loginAttempts +lockUntil',
  );

  // One generic message for: unknown email, wrong password, and locked account,
  // so the response never reveals whether an account exists or how close it is
  // to locking.
  if (!authUser) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_LOGIN);
  }

  if (authUser.isLocked()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_LOGIN);
  }

  const isPasswordMatched = await bcrypt.compare(password, authUser.password);

  if (!isPasswordMatched) {
    await authUser.incrementLoginAttempts();
    throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_LOGIN);
  }

  await authUser.resetLoginAttempts();
  const userProfile = await User.findOne({ id: authUser.userId });
  const tokens = createTokens({
    userId: authUser.userId,
    role: authUser.role,
    email: authUser.email,
  });

  // Store a SHA-256 digest of the refresh token for rotation/reuse detection
  await AuthUser.findByIdAndUpdate(authUser._id, {
    refreshToken: sha256(tokens.refreshToken),
  });

  return {
    ...tokens,
    user: {
      userId: authUser.userId,
      name: userProfile?.name || '',
      email: authUser.email,
      role: authUser.role as 'admin' | 'user',
    },
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  const verified = jwtHelpers.verifyToken(
    token,
    config.jwt.refresh_secret as string,
  );

  if (!verified?.userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const authUser = await AuthUser.findOne({ userId: verified.userId }).select(
    '+refreshToken',
  );

  if (!authUser || !authUser.refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please login again');
  }

  const presented = sha256(token);

  // Reuse detection: a validly-signed token that is not the current one was
  // already rotated away (or stolen). Kill the session entirely.
  if (!safeEqualHex(presented, authUser.refreshToken)) {
    await AuthUser.updateOne({ _id: authUser._id }, { refreshToken: null });
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please login again');
  }

  const newTokens = createTokens({
    userId: authUser.userId,
    role: authUser.role,
    email: authUser.email,
  });

  // Atomic compare-and-swap: of two concurrent refreshes with the same token,
  // exactly one wins; the other sees no match and is treated as reuse.
  const rotated = await AuthUser.findOneAndUpdate(
    { _id: authUser._id, refreshToken: presented },
    { refreshToken: sha256(newTokens.refreshToken) },
  );
  if (!rotated) {
    await AuthUser.updateOne({ _id: authUser._id }, { refreshToken: null });
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please login again');
  }

  return newTokens;
};

const logoutUser = async (userId: string, accessToken?: string): Promise<void> => {
  await AuthUser.findOneAndUpdate({ userId }, { refreshToken: null });

  // Blacklist the access token for its remaining lifetime. auth.authenticate
  // already checks this list; nothing ever wrote to it before.
  if (accessToken) {
    const decoded = jwt.decode(accessToken) as { exp?: number } | null;
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
    if (ttl > 0) {
      await redis.set(accessBlacklistKey(accessToken), '1', 'EX', ttl);
    }
  }
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};
