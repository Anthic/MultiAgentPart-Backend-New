"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const wallet_service_1 = require("./wallet.service");
const getMyWallet = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await wallet_service_1.WalletService.getWalletBalance(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Wallet balance fetched successfully',
        data: result,
    });
});
const getAuditLogs = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await wallet_service_1.WalletService.getAuditLogs(userId, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Token audit logs retrieved successfully',
        data: result,
    });
});
const addFunds = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { amountBDT } = req.body;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await wallet_service_1.WalletService.addFundsToWallet(userId, Number(amountBDT));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Successfully added ৳${amountBDT} to wallet`,
        data: result,
    });
});
exports.WalletController = {
    getMyWallet,
    getAuditLogs,
    addFunds,
};
//# sourceMappingURL=wallet.controller.js.map