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
import { getResearchQuota, refundResearchQuota } from '../../middlewares/rateLimiter';
import { AuthenticatedRequest } from '../../interfaces/auth';
import { WalletService } from '../wallet/wallet.service';
const startResearch = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const { topic, mode } = req.body as IResearchStartRequest;
  const userId = authReq.user?.userId;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }
  let deducatedLog = null
  if (!authReq.isFreeRequest && authReq.chargeAmountBDT) {
    const deduction = await WalletService.deductCredits(userId, {
      action: 'deep_research',
      modelUsed: 'hierarchical-multi-agent',
      promptTokens: 1000,
      completionTokens: 2000,
      costBDT: authReq.chargeAmountBDT,
      creditsDeducted: authReq.chargeAmountBDT
    })
    deducatedLog = deduction.auditLog
  }

  let result: IPythonJobResponse;
  try {
    result = await ResearchService.startResearch({ topic, mode }, userId);
  } catch (error) {
 
    if (authReq.isFreeRequest) {
      await refundResearchQuota(userId)
    } else if(authReq.chargeAmountBDT) {
      await WalletService.addFundsToWallet(userId, authReq.chargeAmountBDT)
    }

    throw error;
  }
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    success: true,
    message: authReq.isFreeRequest
      ? 'Research job started (Free Daily Quota)'
      : `Research job started (Deducted ৳${authReq.chargeAmountBDT} from Wallet)`,
    data: {
      ...result,
      isFreeTrial: authReq.isFreeRequest,
      quota: authReq.researchQuota,
      auditLogId: deducatedLog?._id,
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
  const { jobId } = req.params as { jobId: string }; 
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
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }

  const limit = parseInt(req.query.limit as string) || 10;
  const result = await ResearchService.getResearchHistory(limit, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Research history retrieved successfully',
    data: result,
  });
});

const getHistoryById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id : string};
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }
  const result = await ResearchService.getHistoryById(id, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Research history item retrieved successfully',
    data: result,
  });
});

const getCacheStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await ResearchService.getCacheStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cache stats retrieved successfully',
    data: result,
  });
});
const getAgentHealth = catchAsync(async (_req: Request, res: Response) => {
  const result = await ResearchService.checkAgentHealth();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Agent health retrieved successfully',
    data: result,
  });
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
