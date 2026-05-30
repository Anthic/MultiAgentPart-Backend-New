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
const startResearch = (0, catchAsync_1.default)(async (req, res) => {
    const { topic } = req.body;
    const userId = req.user?.userId;
    let result;
    try {
        result = await research_service_1.ResearchService.startResearch({ topic }, userId);
    }
    catch (error) {
        if (userId && req.researchQuota) {
            await (0, rateLimiter_1.refundResearchQuota)(userId);
        }
        throw error;
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.ACCEPTED,
        success: true,
        message: 'Research job started successfully',
        data: {
            ...result,
            quota: req.researchQuota,
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
    if (!jobId || typeof jobId !== 'string') {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Job ID is required');
    }
    const result = await research_service_1.ResearchService.getJobStatus(jobId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Job status fetched successfully',
        data: result,
    });
});
const getResearchHistory = (0, catchAsync_1.default)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    console.log("=== getResearchHistory req.user ===", req.user);
    const userId = req.user?.userId;
    const result = await research_service_1.ResearchService.getResearchHistory(limit, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Research history fetched successfully',
        data: result,
    });
});
const getHistoryById = (0, catchAsync_1.default)(async (req, res) => {
    const result = await research_service_1.ResearchService.getHistoryById(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, data: result });
});
const getCacheStats = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await research_service_1.ResearchService.getCacheStats();
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, data: result });
});
const getAgentHealth = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await research_service_1.ResearchService.checkAgentHealth();
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, data: result });
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