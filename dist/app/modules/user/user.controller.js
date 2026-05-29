"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const user_service_1 = require("./user.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const createUserByAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...userData } = req.body;
    const result = await user_service_1.UserService.createUserByAdmin(userData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'User created successfully',
        data: result,
    });
});
const getAllUsers = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await user_service_1.UserService.getAllUsers();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Users retrieved successfully',
        data: result,
    });
});
const getUserById = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await user_service_1.UserService.getUserById(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User retrieved successfully',
        data: result,
    });
});
const deleteUserById = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    await user_service_1.UserService.deleteUserById(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User deleted successfully',
        data: null,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await user_service_1.UserService.getMe(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Profile retrieved successfully',
        data: result,
    });
});
const updateMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { ...updateData } = req.body;
    const result = await user_service_1.UserService.updateMe(userId, updateData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
exports.UserController = {
    createUserByAdmin,
    getAllUsers,
    getUserById,
    deleteUserById,
    getMe,
    updateMe,
};
//# sourceMappingURL=user.controller.js.map