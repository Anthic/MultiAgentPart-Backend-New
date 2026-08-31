"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParaphraseController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const paraphrase_service_1 = require("./paraphrase.service");
const paraphraseText = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const payload = req.body;
    const result = await paraphrase_service_1.ParaphraseService.paraphraseText(userId, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Text paraphrased successfully',
        data: result,
    });
});
const getParaphraseHistory = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const history = await paraphrase_service_1.ParaphraseService.getParaphraseHistory(userId, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Paraphrase history retrieved successfully',
        data: history,
    });
});
const estimateCost = (0, catchAsync_1.default)(async (req, res) => {
    const { text } = req.body;
    if (!text) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Text is required for cost estimation');
    }
    const estimate = paraphrase_service_1.ParaphraseService.estimateCost(text);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cost estimation calculated',
        data: estimate,
    });
});
exports.ParaphraseController = {
    paraphraseText,
    getParaphraseHistory,
    estimateCost,
};
//# sourceMappingURL=paraphrase.controller.js.map