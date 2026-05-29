"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCsrf = exports.setCsrfToken = exports.createCsrfTokenForRequest = void 0;
const crypto_1 = require("crypto");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_SESSION_ID = 'csrf';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const isSecureRequest = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https' || config_1.default.env === 'production';
const generateCsrfToken = (sessionId) => {
    const random = (0, crypto_1.randomBytes)(16).toString('hex');
    const payload = `${sessionId}.${random}`;
    const hmac = (0, crypto_1.createHmac)('sha256', config_1.default.csrf_secret)
        .update(payload)
        .digest('hex');
    return `${payload}.${hmac}`;
};
const verifyCsrfToken = (token, sessionId) => {
    let decodedToken = token;
    try {
        decodedToken = decodeURIComponent(token);
    }
    catch {
        return false;
    }
    const parts = decodedToken.split('.');
    if (parts.length !== 3)
        return false;
    const [tSessionId, random, hmac] = parts;
    if (tSessionId !== sessionId)
        return false;
    const payload = `${tSessionId}.${random}`;
    const expectedHmac = (0, crypto_1.createHmac)('sha256', config_1.default.csrf_secret)
        .update(payload)
        .digest('hex');
    if (hmac.length !== expectedHmac.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hmac), Buffer.from(expectedHmac));
};
const setCsrfCookie = (req, res, token) => {
    const isSecure = isSecureRequest(req);
    res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: isSecure ? 'none' : 'lax',
        secure: !!isSecure,
    });
};
const createCsrfTokenForRequest = (req, res) => {
    const token = generateCsrfToken(CSRF_SESSION_ID);
    setCsrfCookie(req, res, token);
    return token;
};
exports.createCsrfTokenForRequest = createCsrfTokenForRequest;
const setCsrfToken = (req, res, next) => {
    if (SAFE_METHODS.includes(req.method) && !req.cookies[CSRF_COOKIE]) {
        (0, exports.createCsrfTokenForRequest)(req, res);
    }
    next();
};
exports.setCsrfToken = setCsrfToken;
const isWhitelistedOrigin = (originHeader, refererHeader) => {
    let requestOrigin = '';
    if (originHeader) {
        requestOrigin = originHeader.trim();
    }
    else if (refererHeader) {
        try {
            const url = new URL(refererHeader);
            requestOrigin = `${url.protocol}//${url.host}`;
        }
        catch {
        }
    }
    if (!requestOrigin)
        return false;
    const normalizedRequestOrigin = requestOrigin.toLowerCase().replace(/\/$/, '');
    if (!config_1.default.cors_origin) {
        return true;
    }
    const allowedOrigins = config_1.default.cors_origin.split(',').map(o => o.trim().toLowerCase().replace(/\/$/, ''));
    return allowedOrigins.includes(normalizedRequestOrigin);
};
const verifyCsrf = (req, _res, next) => {
    if (SAFE_METHODS.includes(req.method)) {
        return next();
    }
    const originHeader = req.headers.origin;
    const refererHeader = req.headers.referer;
    if (isWhitelistedOrigin(originHeader, refererHeader)) {
        return next();
    }
    const token = req.headers[CSRF_HEADER] || req.body?._csrf;
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'CSRF token missing');
    }
    if (!verifyCsrfToken(token, CSRF_SESSION_ID)) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Invalid CSRF token');
    }
    next();
};
exports.verifyCsrf = verifyCsrf;
//# sourceMappingURL=csrf.middleware.js.map