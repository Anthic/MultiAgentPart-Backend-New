"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRequestLimiter = exports.authRateLimiter = exports.apiRateLimiter = exports.getResearchQuota = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../../config"));
const redis_1 = require("../../config/redis");
const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const windowMs = toNumber(config_1.default.rate_limit_window_ms, 15 * 60 * 1000);
const maxRequests = toNumber(config_1.default.rate_limit_max, 100);
const researchDailyLimit = toNumber(config_1.default.research_daily_limit, 3);
const researchQuotaTtlSeconds = 24 * 60 * 60;
const researchQuotaKey = (userId) => `research_quota:${userId}`;
const getResetAt = (ttlSeconds) => {
    if (ttlSeconds <= 0)
        return null;
    return new Date(Date.now() + ttlSeconds * 1000).toISOString();
};
const getResearchQuota = async (userId) => {
    const key = researchQuotaKey(userId);
    const [current, ttl] = await Promise.all([redis_1.redis.get(key), redis_1.redis.ttl(key)]);
    const used = Math.min(parseInt(current ?? '0', 10), researchDailyLimit);
    return {
        limit: researchDailyLimit,
        used,
        remaining: Math.max(researchDailyLimit - used, 0),
        resetAt: getResetAt(ttl),
    };
};
exports.getResearchQuota = getResearchQuota;
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: Math.max(10, Math.floor(maxRequests / 5)),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many auth attempts, please try again later.',
    },
});
const aiRequestLimiter = async (req, res, next) => {
    if (!req.user) {
        next();
        return;
    }
    try {
        const userId = req.user.userId;
        const key = researchQuotaKey(userId);
        const result = (await redis_1.redis.eval(`
      local current = tonumber(redis.call("GET", KEYS[1]) or "0")
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      if current >= limit then
        return {0, current, redis.call("TTL", KEYS[1])}
      end

      current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ttl)
      end

      return {1, current, redis.call("TTL", KEYS[1])}
      `, 1, key, researchDailyLimit, researchQuotaTtlSeconds));
        const [allowed, rawUsed, ttl] = result;
        const used = Math.min(Number(rawUsed), researchDailyLimit);
        const quota = {
            limit: researchDailyLimit,
            used,
            remaining: Math.max(researchDailyLimit - used, 0),
            resetAt: getResetAt(Number(ttl)),
        };
        if (!allowed) {
            res.status(429).json({
                statusCode: 429,
                success: false,
                message: 'Daily research limit reached. Try again after the quota resets.',
                data: { quota },
            });
            return;
        }
        req.researchQuota = quota;
        next();
    }
    catch (error) {
        console.error('Rate limiter error:', error);
        next();
    }
};
exports.aiRequestLimiter = aiRequestLimiter;
//# sourceMappingURL=rateLimiter.js.map