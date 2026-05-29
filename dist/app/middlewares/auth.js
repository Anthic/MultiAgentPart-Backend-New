"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const config_1 = __importDefault(require("../../config"));
const jwtHelpers_1 = require("../helpers/jwtHelpers");
const auth_1 = require("../constants/auth");
const authenticate = (req, _res, next) => {
    let token = req.cookies?.[auth_1.authCookieNames.accessToken];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Authentication required');
    }
    try {
        const verified = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.access_secret);
        req.user = {
            userId: verified.userId,
            role: verified.role,
            email: verified.email,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Token has expired, please refresh');
        }
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid token');
    }
};
const authorizeRoles = (...roles) => {
    return (req, _res, next) => {
        if (roles.length && !roles.includes(req.user?.role)) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Access denied');
        }
        next();
    };
};
exports.auth = {
    authenticate,
    authorizeRoles,
    authorize: authorizeRoles,
};
//# sourceMappingURL=auth.js.map