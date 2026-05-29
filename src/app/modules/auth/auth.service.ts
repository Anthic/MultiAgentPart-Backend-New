import mongoose from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

  const refreshToken = jwtHelpers.createToken(
    payload,
    config.jwt.refresh_secret as string,
    (config.jwt.refresh_expires_in || '7d') as SignOptions['expiresIn'],
  );

  return { accessToken, refreshToken };
};

const registerUser = async (
  payload: IRegisterUser,
): Promise<ILoginUserServiceResponse> => {
  const { name, email, password } = payload;

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
  const { email, password } = payload;

  const authUser = await AuthUser.findOne({ email }).select(
    '+password +loginAttempts +lockUntil',
  );

  if (!authUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  // Check if locked
  if (authUser.isLocked()) {
    const remainingTime = Math.ceil(
      (authUser.lockUntil!.getTime() - Date.now()) / 60000,
    );
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      `Account locked. Try again in ${remainingTime} minutes`,
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, authUser.password);

  if (!isPasswordMatched) {
    await authUser.incrementLoginAttempts();
    const updatedUser = await AuthUser.findById(authUser._id).select(
      '+loginAttempts +lockUntil',
    );
    if (updatedUser?.isLocked()) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Account locked due to too many failed attempts',
      );
    }
    const remaining = config.account_lock.max_attempts - updatedUser!.loginAttempts;
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      `Invalid credentials. ${remaining} attempts remaining`,
    );
  }

  await authUser.resetLoginAttempts();
  const userProfile = await User.findOne({ id: authUser.userId });
  const tokens = createTokens({
    userId: authUser.userId,
    role: authUser.role,
    email: authUser.email,
  });

  // Store hashed refresh token for rotation
  const hashedRT = await bcrypt.hash(tokens.refreshToken, 10);
  await AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: hashedRT });

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

  // Rotation check
  const isMatch = await bcrypt.compare(token, authUser.refreshToken);
  if (!isMatch) {
    await AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: null });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Token reuse detected. Please login again',
    );
  }

  const newTokens = createTokens({
    userId: authUser.userId,
    role: authUser.role,
    email: authUser.email,
  });

  const newHashedRT = await bcrypt.hash(newTokens.refreshToken, 10);
  await AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: newHashedRT });

  return newTokens;
};

const logoutUser = async (userId: string): Promise<void> => {
  await AuthUser.findOneAndUpdate({ userId }, { refreshToken: null });
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};
