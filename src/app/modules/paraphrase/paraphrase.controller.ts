import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { ParaphraseService } from './paraphrase.service';
import { IParaphraseRequest } from './paraphrase.interface';

const paraphraseText = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const payload = req.body as IParaphraseRequest;
  const result = await ParaphraseService.paraphraseText(userId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Text paraphrased successfully',
    data: result,
  });
});

const getParaphraseHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const history = await ParaphraseService.getParaphraseHistory(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Paraphrase history retrieved successfully',
    data: history,
  });
});

const estimateCost = catchAsync(async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Text is required for cost estimation');
  }

  const estimate = ParaphraseService.estimateCost(text);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cost estimation calculated',
    data: estimate,
  });
});

export const ParaphraseController = {
  paraphraseText,
  getParaphraseHistory,
  estimateCost,
};
