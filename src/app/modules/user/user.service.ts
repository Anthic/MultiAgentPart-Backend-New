import { randomUUID } from 'crypto';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { AuthUser } from '../auth/auth.model';
import { IAdminCreateUser, IUser, IUserUpdatePayload } from './user.interface';
import { User } from './user.model';

const createUserByAdmin = async (payload: IAdminCreateUser): Promise<IUser> => {
  const { name, email, password, role } = payload;

  const existingUser = await AuthUser.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'User already exists');
  }

  const userId = randomUUID();

  const authUser = await AuthUser.create({
    userId,
    email,
    password,
    role: role || 'user',
  });

  const createdUser = await User.create({
    id: userId,
    name,
    email,
    role: authUser.role,
  });

  return createdUser.toObject() as IUser;
};

const getAllUsers = async (): Promise<IUser[]> => {
  const users = await User.find();
  return users as IUser[];
};

const getUserById = async (userId: string): Promise<IUser> => {
  const user = (await User.findOne({ id: userId })) as IUser | null;
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

const deleteUserById = async (userId: string): Promise<void> => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await AuthUser.deleteOne({ userId });
  await User.deleteOne({ id: userId });
};

const getMe = async (userId: string): Promise<IUser> => {
  const user = (await User.findOne({ id: userId })) as IUser | null;
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

const updateMe = async (
  userId: string,
  payload: IUserUpdatePayload,
): Promise<IUser> => {
  if (payload.email) {
    const existingAuthUser = await AuthUser.findOne({
      email: payload.email,
      userId: { $ne: userId },
    });
    if (existingAuthUser) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already in use');
    }
    await AuthUser.updateOne({ userId }, { email: payload.email });
  }

  const updatedUser = await User.findOneAndUpdate({ id: userId }, payload, {
    new: true,
  });

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return updatedUser as IUser;
};

export const UserService = {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  deleteUserById,
  getMe,
  updateMe,
};
