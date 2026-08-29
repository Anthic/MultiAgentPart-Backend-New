"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const research_service_1 = require("./research.service");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const wallet_service_1 = require("../wallet/wallet.service");
const startResearch = (0, catchAsync_1.default)(async (req, res) => {
    const authReq = req;
    const { topic, mode } = req.body;
    const userId = authReq.user?.userId;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    }
    let deducatedLog = null;
    if (!authReq.isFreeRequest && authReq.chargeAmountBDT) {
        const deduction = await wallet_service_1.WalletService.deductCredits(userId, {
            action: 'deep_research',
            modelUsed: 'hierarchical-multi-agent',
            promptTokens: 1000,
            completionTokens: 2000,
            costBDT: authReq.chargeAmountBDT,
            creditsDeducted: authReq.chargeAmountBDT
        });
        deducatedLog = deduction.auditLog;
    }
    let result;
    try {
        result = await research_service_1.ResearchService.startResearch({ topic, mode }, userId);
    }
    catch (error) {
        if (authReq.isFreeRequest) {
            await (0, rateLimiter_1.refundResearchQuota)(userId);
        }
        else if (authReq.chargeAmountBDT) {
            await wallet_service_1.WalletService.addFundsToWallet(userId, authReq.chargeAmountBDT);
        }
        throw error;
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.ACCEPTED,
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
const getResearchQuotaStatus = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await (0, rateLimiter_1.getResearchQuota)(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Research quota fetched successfully',
        data: result,
    });
});
const getJobStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user?.userId;
    if (!jobId || typeof jobId !== 'string') {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Job ID is required');
    }
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await research_service_1.ResearchService.getJobStatus(jobId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Job status fetched successfully',
        data: result,
    });
});
const getResearchHistory = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    }
    const limit = parseInt(req.query.limit) || 10;
    const result = await research_service_1.ResearchService.getResearchHistory(limit, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Research history retrieved successfully',
        data: result,
    });
});
const getHistoryById = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await research_service_1.ResearchService.getHistoryById(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Research history item retrieved successfully',
        data: result,
    });
});
const getCacheStats = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await research_service_1.ResearchService.getCacheStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cache stats retrieved successfully',
        data: result,
    });
});
const getAgentHealth = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await research_service_1.ResearchService.checkAgentHealth();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Agent health retrieved successfully',
        data: result,
    });
});
exports.ResearchController = {
    startResearch,
    getResearchQuota: getResearchQuotaStatus,
    getJobStatus,
    getResearchHistory,
    getHistoryById,
    getCacheStats,
    getAgentHealth,
};
//# sourceMappingURL=research.controller.js.map