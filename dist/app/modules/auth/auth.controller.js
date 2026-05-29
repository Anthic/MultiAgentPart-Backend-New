"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = require("./auth.service");
const user_model_1 = require("../user/user.model");
const config_1 = __importDefault(require("../../../config"));
const auth_1 = require("../../constants/auth");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const getAccessCookieOptions = (req) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config_1.default.env === 'production';
    return {
        httpOnly: true,
        secure: !!isSecure,
        sameSite: (isSecure ? 'none' : 'lax'),
        domain: config_1.default.cookie.domain || undefined,
        maxAge: 15 * 60 * 1000,
    };
};
const getRefreshCookieOptions = (req) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config_1.default.env === 'production';
    return {
        httpOnly: true,
        secure: !!isSecure,
        sameSite: (isSecure ? 'none' : 'lax'),
        domain: config_1.default.cookie.domain || undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
};
const getClearCookieOptions = (req) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || config_1.default.env === 'production';
    return {
        httpOnly: true,
        secure: !!isSecure,
        sameSite: (isSecure ? 'none' : 'lax'),
        domain: config_1.default.cookie.domain || undefined,
    };
};
const registerUser = (0, catchAsync_1.default)(async (req, res) => {
    const { ...registerData } = req.body;
    const result = await auth_service_1.AuthService.registerUser(registerData);
    res.cookie(auth_1.authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
    res.cookie(auth_1.authCookieNames.refreshToken, result.refreshToken, getRefreshCookieOptions(req));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Account created successfully',
        data: { user: result.user },
    });
});
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const { ...loginData } = req.body;
    const result = await auth_service_1.AuthService.loginUser(loginData);
    res.cookie(auth_1.authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
    res.cookie(auth_1.authCookieNames.refreshToken, result.refreshToken, getRefreshCookieOptions(req));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User logged in successfully',
        data: { user: result.user },
    });
});
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.cookies?.[auth_1.authCookieNames.refreshToken];
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Refresh token missing');
    }
    const result = await auth_service_1.AuthService.refreshToken(token);
    res.cookie(auth_1.authCookieNames.accessToken, result.accessToken, getAccessCookieOptions(req));
    res.cookie(auth_1.authCookieNames.refreshToken, result.refreshToken, getRefreshCookieOptions(req));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Tokens rotated successfully',
        data: result,
    });
});
const logoutUser = (0, catchAsync_1.default)(async (req, res) => {
    if (req.user?.userId) {
        await auth_service_1.AuthService.logoutUser(req.user.userId);
    }
    res.clearCookie(auth_1.authCookieNames.accessToken, getClearCookieOptions(req));
    res.clearCookie(auth_1.authCookieNames.refreshToken, getClearCookieOptions(req));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Logged out successfully',
        data: null,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const user = await user_model_1.User.findOne({ id: userId });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User retrieved successfully',
        data: user,
    });
});
exports.AuthController = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getMe,
};
//# sourceMappingURL=auth.controller.js.map