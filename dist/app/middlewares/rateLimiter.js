"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRequestLimiter = exports.authRateLimiter = exports.apiRateLimiter = exports.refundResearchQuota = exports.getResearchQuota = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../../config"));
const redis_1 = require("../../config/redis");
const wallet_model_1 = require("../modules/wallet/wallet.model");
const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const windowMs = toNumber(config_1.default.rate_limit_window_ms, 15 * 60 * 1000);
const maxRequests = toNumber(config_1.default.rate_limit_max, 100);
const FREE_DAILY_RESEARCH_LIMIT = 1;
const RESEARCH_COST_BDT = 10.0;
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
    const used = Math.min(parseInt(current ?? '0', 10), FREE_DAILY_RESEARCH_LIMIT);
    return {
        limit: FREE_DAILY_RESEARCH_LIMIT,
        used,
        remaining: Math.max(FREE_DAILY_RESEARCH_LIMIT - used, 0),
        resetAt: getResetAt(ttl),
    };
};
exports.getResearchQuota = getResearchQuota;
const refundResearchQuota = async (userId) => {
    const key = researchQuotaKey(userId);
    await redis_1.redis.eval(`
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    if current > 0 then
      return redis.call("DECR", KEYS[1])
    else
      return 0
    end
    `, 1, key);
};
exports.refundResearchQuota = refundResearchQuota;
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
        const currentUsageStr = await redis_1.redis.get(key);
        const ttl = await redis_1.redis.ttl(key);
        const currentUsage = parseInt(currentUsageStr || '0', 10);
        const quota = {
            limit: FREE_DAILY_RESEARCH_LIMIT,
            used: Math.min(currentUsage, FREE_DAILY_RESEARCH_LIMIT),
            remaining: Math.max(FREE_DAILY_RESEARCH_LIMIT - currentUsage, 0),
            resetAt: getResetAt(Number(ttl)),
        };
        if (currentUsage < FREE_DAILY_RESEARCH_LIMIT) {
            await redis_1.redis.incr(key);
            if (currentUsage === 0) {
                await redis_1.redis.expire(key, researchQuotaTtlSeconds);
            }
            req.isFreeRequest = true;
            req.researchQuota = quota;
            return next();
        }
        const wallet = await wallet_model_1.Wallet.findOne({ userId });
        const userBalance = wallet?.balanceBDT || 0;
        if (wallet && userBalance >= RESEARCH_COST_BDT) {
            req.isFreeRequest = false;
            req.chargeAmountBDT = RESEARCH_COST_BDT;
            req.researchQuota = quota;
            return next();
        }
        res.status(402).json({
            statusCode: 402,
            success: false,
            message: `Daily free trial limit (1/1) reached. Additional searches cost ৳${RESEARCH_COST_BDT}. Your balance: ৳${userBalance.toFixed(2)}. Please recharge via bKash/Nagad to continue.`,
            data: {
                quota,
                walletBalanceBDT: userBalance,
                requiredBDT: RESEARCH_COST_BDT,
            },
        });
        return;
    }
    catch (error) {
        console.error('Rate limiter error:', error);
        next();
    }
};
exports.aiRequestLimiter = aiRequestLimiter;
//# sourceMappingURL=rateLimiter.js.map