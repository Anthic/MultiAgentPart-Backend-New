"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const paper_service_1 = require("./paper.service");
const createPaper = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.createPaper(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Paper created successfully',
        data: result,
    });
});
const getAllPapers = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.getAllPapers(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Papers retrieved successfully',
        data: result,
    });
});
const getSinglePaper = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.getSinglePaper(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Paper retrieved successfully',
        data: result,
    });
});
const updatePaper = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.updatePaper(id, userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Paper updated successfully',
        data: result,
    });
});
const deletePaper = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.deletePaper(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Paper deleted successfully',
        data: result,
    });
});
const addCitation = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await paper_service_1.PaperService.addCitation(id, userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Citation added to paper successfully',
        data: result,
    });
});
exports.PaperController = {
    createPaper,
    getAllPapers,
    getSinglePaper,
    updatePaper,
    deletePaper,
    addCitation,
};
//# sourceMappingURL=paper.controller.js.map