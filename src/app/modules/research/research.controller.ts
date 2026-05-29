import catchAsync from '../../utils/catchAsync';
import { Request, Response } from 'express';
import {
  IPythonJobResponse,
  IResearchStartRequest,
} from './research.interface';
import { ResearchService } from './research.service';
import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { getResearchQuota } from '../../middlewares/rateLimiter';
const startResearch = catchAsync(async (req: Request, res: Response) => {
  const { topic } = req.body as IResearchStartRequest;
  const userId = req.user?.userId;

  const result = await ResearchService.startResearch({ topic }, userId);

  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    success: true,
    message: 'Research job started successfully',
    data: {
      ...result,
      quota: req.researchQuota,
    },
  });
});

const getResearchQuotaStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }

  const result = await getResearchQuota(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Research quota fetched successfully',
    data: result,
  });
});

const getJobStatus = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  if (!jobId || typeof jobId !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const result = await ResearchService.getJobStatus(jobId);

  sendResponse<IPythonJobResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Job status fetched successfully',
    data: result,
  });
});

const getResearchHistory = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  console.log("=== getResearchHistory req.user ===", req.user);
  const userId = req.user?.userId;

  const result = await ResearchService.getResearchHistory(limit, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Research history fetched successfully',
    data: result,
  });
});

const getHistoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await ResearchService.getHistoryById(req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, data: result });
});
const getCacheStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await ResearchService.getCacheStats();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, data: result });
});
const getAgentHealth = catchAsync(async (_req: Request, res: Response) => {
  const result = await ResearchService.checkAgentHealth();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, data: result });
});

export const ResearchController = {
  startResearch,
  getResearchQuota: getResearchQuotaStatus,
  getJobStatus,
  getResearchHistory,
  getHistoryById,
  getCacheStats,
  getAgentHealth,
};
