"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = require("crypto");
const requestIdMiddleware = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || (0, crypto_1.randomUUID)();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    const startTime = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${timeInMs}ms`);
        }
    });
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
//# sourceMappingURL=requestId.middleware.js.map