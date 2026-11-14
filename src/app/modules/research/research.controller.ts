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
import { clampInt } from '../../utils/pagination';
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
      // refundCredits (not addFunds) so totalSpentBDT and the audit log are
      // reversed too, instead of still showing a charge for a failed start.
      await WalletService.refundCredits(userId, {
        costBDT: authReq.chargeAmountBDT,
        tokensToRefund: 3000,
        reason: 'Research job failed to start',
        action: 'deep_research',
      })
    }

    throw error;
  }

  // The job runs asynchronously in the Python service. Record what it cost so a
  // later failure (status "failed") refunds the user when they poll it.
  if (result?.job_id && result.status !== 'done') {
    await ResearchService.registerJobCharge(result.job_id, {
      userId,
      kind: authReq.isFreeRequest ? 'free' : 'paid',
      amountBDT: authReq.isFreeRequest ? 0 : authReq.chargeAmountBDT || 0,
    });
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
  const userId = req.user?.userId;
  if (!jobId || typeof jobId !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }
  const result = await ResearchService.getJobStatus(jobId, userId);
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

  const limit = clampInt(req.query.limit, 10, 1, 50);
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
