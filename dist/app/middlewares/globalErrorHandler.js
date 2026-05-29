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
        const isOperationalError = error instanceof ApiError_1.default && (error.statusCode === 401 || error.statusCode === 403);
        if (!isOperationalError) {
            console.log(' globalErrorHandler ~~', error);
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
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error.message,
                },
            ]
            : [];
    }
    else if (error instanceof mongoose_1.Error.ValidationError) {
        statusCode = http_status_1.default.UNPROCESSABLE_ENTITY;
        message = 'Validation error';
        errorMessages = Object.values(error.errors).map((err) => ({
            path: err.path,
            message: err.message,
        }));
    }
    else if (error instanceof mongoose_1.Error.CastError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = 'Invalid identifier';
        errorMessages = [
            {
                path: error.path,
                message: error.message,
            },
        ];
    }
    else if (error.code === 11000) {
        statusCode = http_status_1.default.CONFLICT;
        message = 'Duplicate value';
        errorMessages = [
            {
                path: Object.keys(error.keyValue || {})[0] || '',
                message: 'Duplicate value found',
            },
        ];
    }
    else if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        statusCode = http_status_1.default.UNAUTHORIZED;
        message = 'Token expired';
        errorMessages = [{ path: '', message }];
    }
    else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        statusCode = http_status_1.default.UNAUTHORIZED;
        message = 'Invalid token';
        errorMessages = [{ path: '', message }];
    }
    else if (error instanceof Error) {
        message = error.message;
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error.message,
                },
            ]
            : [];
    }
    else if (error instanceof SyntaxError && 'body' in error) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = 'Invalid JSON in request body';
        errorMessages = [{ path: '', message }];
    }
    res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errorMessages,
        stack: config_1.default.env !== 'production' ? error?.stack : undefined,
    });
};
exports.default = globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map