import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { WalletService } from './wallet.service';

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await WalletService.getWalletBalance(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet balance fetched successfully',
    data: result,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await WalletService.getAuditLogs(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token audit logs retrieved successfully',
    data: result,
  });
});

const addFunds = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { amountBDT } = req.body;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await WalletService.addFundsToWallet(userId, Number(amountBDT));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Successfully added ৳${amountBDT} to wallet`,
    data: result,
  });
});

export const WalletController = {
  getMyWallet,
  getAuditLogs,
  addFunds,
};
