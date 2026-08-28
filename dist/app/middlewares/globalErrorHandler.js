"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = require("jsonwebtoken");
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const globalErrorHandler = (error, _req, res, _next) => {
    if (config_1.default.env === 'development') {
        const isOperational = error instanceof ApiError_1.default && (error.statusCode === 401 || error.statusCode === 403);
        if (!isOperational) {
            console.error('[Global Error]', error);
        }
    }
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let errorMessages = [];
    if (error instanceof zod_1.ZodError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = 'Validation error';
        errorMessages = error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
        }));
    }
    else if (error instanceof ApiError_1.default) {
        statusCode = error.statusCode;
        message = error.message;
        errorMessages = error.message ? [{ path: '', message: error.message }] : [];
    }
    else if (error instanceof mongoose_1.Error.ValidationError) {
        statusCode = http_status_1.default.UNPROCESSABLE_ENTITY;
        message = 'Database validation failed';
        errorMessages = Object.values(error.errors).map((err) => ({
            path: err.path,
            message: err.message,
        }));
    }
    else if (error instanceof mongoose_1.Error.CastError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = 'Invalid resource identifier';
        errorMessages = [{ path: error.path, message: error.message }];
    }
    else if (error.code === 11000) {
        statusCode = http_status_1.default.CONFLICT;
        message = 'Duplicate record found';
        errorMessages = [{ path: '', message: 'A record with this unique value already exists' }];
    }
    else if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        statusCode = http_status_1.default.UNAUTHORIZED;
        message = 'Token has expired';
        errorMessages = [{ path: '', message: 'Token has expired, please log in again' }];
    }
    else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        statusCode = http_status_1.default.UNAUTHORIZED;
        message = 'Invalid authentication token';
        errorMessages = [{ path: '', message: 'Token is malformed or invalid' }];
    }
    res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errorMessages,
        stack: config_1.default.env === 'development' ? error.stack : undefined,
    });
};
exports.default = globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map