"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = require("zod/v4");
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const validateRequest = (schema) => {
    return async (req, _res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (err) {
            if (err instanceof v4_1.ZodError) {
                const message = err.issues.map((e) => e.message).join(', ');
                next(new ApiError_1.default(http_status_1.default.BAD_REQUEST, message));
            }
            else {
                next(err);
            }
        }
    };
};
exports.default = validateRequest;
//# sourceMappingURL=validateRequest.js.map