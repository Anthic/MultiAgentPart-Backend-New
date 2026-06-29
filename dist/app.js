"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_status_1 = __importDefault(require("http-status"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const sanitize_middleware_1 = require("./app/middlewares/sanitize.middleware");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const routes_1 = __importDefault(require("./app/routes"));
const rateLimiter_1 = require("./app/middlewares/rateLimiter");
const config_1 = __importDefault(require("./config"));
const csrf_middleware_1 = require("./app/middlewares/csrf.middleware");
const compression_1 = __importDefault(require("compression"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((req, _res, next) => {
    const query = req.query;
    const params = req.params;
    Object.defineProperty(req, 'query', {
        value: query,
        writable: true,
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(req, 'params', {
        value: params,
        writable: true,
        enumerable: true,
        configurable: true,
    });
    next();
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: config_1.default.cors_origin ? config_1.default.cors_origin.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(csrf_middleware_1.setCsrfToken);
app.get('/api/v1/csrf-token', (req, res) => {
    const token = (0, csrf_middleware_1.createCsrfTokenForRequest)(req, res);
    res.status(http_status_1.default.OK).json({
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'CSRF token generated successfully',
        data: { csrfToken: token },
    });
});
app.use(csrf_middleware_1.verifyCsrf);
app.use((0, helmet_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
app.use(sanitize_middleware_1.sanitizeMiddleware);
app.use(rateLimiter_1.apiRateLimiter);
app.use('/api/v1/auth', rateLimiter_1.authRateLimiter);
app.use('/api/v1', routes_1.default);
app.get('/', (_req, res) => {
    res.send('MultiAgent backend is running!');
});
app.use(globalErrorHandler_1.default);
app.use((req, res, _next) => {
    res.status(http_status_1.default.NOT_FOUND).json({
        statusCode: http_status_1.default.NOT_FOUND,
        success: false,
        message: 'Not Found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: 'API Not Found',
            },
        ],
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map