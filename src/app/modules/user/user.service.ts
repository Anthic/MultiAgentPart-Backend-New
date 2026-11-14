import { randomUUID } from 'crypto';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { AuthUser } from '../auth/auth.model';
import { IAdminCreateUser, IUser, IUserUpdatePayload } from './user.interface';
import { User } from './user.model';
import { Wallet } from '../wallet/wallet.model';
import { Note } from '../note/note.model';
import { Paper } from '../paper/paper.model';
import { ParaphraseHistory } from '../paraphrase/paraphrase.model';
import { redis } from '../../../config/redis';
import { userRevokedKey } from '../../utils/tokenSecurity';
import { validatePasswordComplexity } from '../../utils/passwordUtils';

const createUserByAdmin = async (payload: IAdminCreateUser): Promise<IUser> => {
  const { name, password, role } = payload;
  const email = String(payload.email).trim().toLowerCase();

  // Admin-created accounts get the same password policy as self-signup.
  const { isValid, errors } = validatePasswordComplexity(password);
  if (!isValid) throw new ApiError(httpStatus.BAD_REQUEST, errors.join(', '));

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

const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
): Promise<{ data: IUser[]; meta: { page: number; limit: number; total: number } }> => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return {
    data: users as IUser[],
    meta: {
      page,
      limit,
      total,
    },
  };
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

  // Cascade the user's own data. Payment and TokenAuditLog rows are kept on
  // purpose: they are financial records. (Python-side history/vault vectors are
  // not removed here; the agent service has no delete-by-user endpoint yet.)
  await Promise.all([
    Wallet.deleteOne({ userId }),
    Note.deleteMany({ userId }),
    Paper.deleteMany({ userId }),
    ParaphraseHistory.deleteMany({ userId }),
  ]);

  // Existing access tokens must stop working now, not at their expiry.
  try {
    await redis.set(userRevokedKey(userId), '1', 'EX', 24 * 60 * 60);
    await redis.del(`research_quota:${userId}`);
  } catch (err) {
    console.error('[deleteUser] failed to revoke sessions in Redis:', (err as Error).message);
  }
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
  // Explicit allowlist (mass-assignment guard). Never pass req.body straight
  // to the update: role / id would be writable otherwise.
  const update: { name?: string; email?: string } = {};
  if (typeof payload.name === 'string') update.name = payload.name.trim();
  if (typeof payload.email === 'string') update.email = payload.email.trim().toLowerCase();

  if (Object.keys(update).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Nothing to update');
  }

  if (update.email) {
    const taken =
      (await AuthUser.findOne({ email: update.email, userId: { $ne: userId } })) ||
      (await User.findOne({ email: update.email, id: { $ne: userId } }));
    if (taken) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already in use');
    }
    await AuthUser.updateOne({ userId }, { email: update.email });
  }

  const updatedUser = await User.findOneAndUpdate({ id: userId }, update, {
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
