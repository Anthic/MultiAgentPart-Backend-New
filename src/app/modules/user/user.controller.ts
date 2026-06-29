import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { UserService } from './user.service';
import { IAdminCreateUser, IUser, IUserUpdatePayload } from './user.interface';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const createUserByAdmin = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body as IAdminCreateUser;
  const result = await UserService.createUserByAdmin(userData);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const { data, meta } = await UserService.getAllUsers(page, limit);
  sendResponse<IUser[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta,
    data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  const result = await UserService.getUserById(userId);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  await UserService.deleteUserById(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await UserService.getMe(userId);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const { ...updateData } = req.body as IUserUpdatePayload;
  const result = await UserService.updateMe(userId, updateData);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

export const UserController = {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  deleteUserById,
  getMe,
  updateMe,
};
