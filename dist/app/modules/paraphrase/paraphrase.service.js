"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParaphraseService = void 0;
const axios_1 = __importDefault(require("axios"));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const redis_1 = require("../../../config/redis");
const wallet_service_1 = require("../wallet/wallet.service");
const paraphrase_model_1 = require("./paraphrase.model");
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://api-atlash.duckdns.org';
const PARAPHRASE_TIMEOUT_MS = Number(process.env.PARAPHRASE_TIMEOUT_MS) || 30000;
const DEFAULT_MODEL = process.env.PARAPHRASE_DEFAULT_MODEL || 'worker-groq';
const TIER_LIMITS = {
    free: {
        MAX_CHARACTERS: 500,
        MAX_REQUESTS_PER_DAY: 5,
        MAX_REQUESTS_PER_HOUR: 2,
    },
    pro: {
        MAX_CHARACTERS: 5000,
        MAX_REQUESTS_PER_DAY: 50,
        MAX_REQUESTS_PER_HOUR: 10,
    },
    enterprise: {
        MAX_CHARACTERS: 20000,
        MAX_REQUESTS_PER_DAY: 500,
        MAX_REQUESTS_PER_HOUR: 100,
    },
};
const MODEL_PRICING = {
    'worker-groq': { input: 8, output: 24 },
    'worker-gemini': { input: 10, output: 30 },
    'worker-mistral': { input: 25, output: 75 },
};
const estimateCost = (text, model = DEFAULT_MODEL) => {
    const charCount = text.length;
    const estimatedTokens = Math.max(1, Math.ceil(charCount * 0.25));
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['worker-groq'];
    const costPerToken = (pricing.input + pricing.output) / 1_000_000;
    const estimatedCostBDT = Number((estimatedTokens * costPerToken).toFixed(6));
    return {
        charCount,
        estimatedTokens,
        estimatedCostBDT: Math.max(0.001, estimatedCostBDT),
        model,
    };
};
const checkRateLimit = async (userId, tier) => {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const currentHour = new Date().toISOString().slice(0, 13);
    const currentDay = new Date().toISOString().slice(0, 10);
    const hourKey = `paraphrase:rate:${userId}:hour:${currentHour}`;
    const dayKey = `paraphrase:rate:${userId}:day:${currentDay}`;
    try {
        const [hourUsageStr, dayUsageStr] = await Promise.all([
            redis_1.redis.get(hourKey),
            redis_1.redis.get(dayKey),
        ]);
        const hourUsage = hourUsageStr ? parseInt(hourUsageStr, 10) : 0;
        const dayUsage = dayUsageStr ? parseInt(dayUsageStr, 10) : 0;
        if (hourUsage >= limits.MAX_REQUESTS_PER_HOUR) {
            const now = new Date();
            const minutesRemaining = 60 - now.getMinutes();
            throw new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, `Hourly rate limit reached for your ${tier} plan (${limits.MAX_REQUESTS_PER_HOUR} requests/hr). Limit resets in ${minutesRemaining} minutes.`);
        }
        if (dayUsage >= limits.MAX_REQUESTS_PER_DAY) {
            throw new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, `Daily quota exceeded for your ${tier} plan (${limits.MAX_REQUESTS_PER_DAY} requests/day). Limit resets tomorrow.`);
        }
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        console.error('[Paraphrase Rate Limit Check Error]:', error);
    }
};
const incrementRateLimit = async (userId) => {
    const currentHour = new Date().toISOString().slice(0, 13);
    const currentDay = new Date().toISOString().slice(0, 10);
    const hourKey = `paraphrase:rate:${userId}:hour:${currentHour}`;
    const dayKey = `paraphrase:rate:${userId}:day:${currentDay}`;
    try {
        const multi = redis_1.redis.multi();
        multi.incr(hourKey);
        multi.expire(hourKey, 3600);
        multi.incr(dayKey);
        multi.expire(dayKey, 86400);
        await multi.exec();
    }
    catch (error) {
        console.error('[Paraphrase Rate Limit Increment Error]:', error);
    }
};
const callPythonParaphraser = async (payload, userId) => {
    const endpoint = `${PYTHON_API_URL.replace(/\/$/, '')}/api/v1/paraphrase`;
    let lastError = null;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios_1.default.post(endpoint, {
                text: payload.text,
                mode: payload.mode,
                user_id: userId,
            }, {
                timeout: PARAPHRASE_TIMEOUT_MS,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'AtlasAI-Backend/1.0',
                },
            });
            const data = response.data;
            if (!data || typeof data.paraphrased_text !== 'string') {
                throw new Error('Invalid response payload received from AI Paraphraser engine.');
            }
            return {
                paraphrased_text: data.paraphrased_text,
                mode: data.mode || payload.mode,
                provider_used: data.provider_used || DEFAULT_MODEL,
                duration_sec: typeof data.duration_sec === 'number' ? data.duration_sec : 0,
                token_usage: {
                    prompt_tokens: data.token_usage?.prompt_tokens || 0,
                    completion_tokens: data.token_usage?.completion_tokens || 0,
                    total_tokens: data.token_usage?.total_tokens ||
                        (data.token_usage?.prompt_tokens || 0) + (data.token_usage?.completion_tokens || 0),
                },
            };
        }
        catch (error) {
            lastError = error;
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                break;
            }
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
            }
        }
    }
    if (lastError?.code === 'ECONNABORTED' || lastError?.message?.includes('timeout')) {
        throw new ApiError_1.default(http_status_1.default.GATEWAY_TIMEOUT, 'AI Paraphraser timed out. The service is taking longer than usual.');
    }
    const message = lastError?.response?.data?.detail ||
        lastError?.response?.data?.message ||
        lastError?.message ||
        'AI Paraphraser engine failed to process the text.';
    throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, message);
};
const paraphraseText = async (userId, payload) => {
    const wallet = await wallet_service_1.WalletService.getOrCreateWallet(userId);
    const tier = wallet.subscriptionTier || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const textLength = payload.text.trim().length;
    if (textLength > limits.MAX_CHARACTERS) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Character limit exceeded. Your ${tier} tier allows up to ${limits.MAX_CHARACTERS} characters (you provided ${textLength} characters). Upgrade your plan to increase limits.`);
    }
    await checkRateLimit(userId, tier);
    const costEstimate = estimateCost(payload.text);
    const costBDT = costEstimate.estimatedCostBDT;
    if (wallet.balanceBDT < costBDT) {
        const shortfall = Number((costBDT - wallet.balanceBDT).toFixed(4));
        throw new ApiError_1.default(http_status_1.default.PAYMENT_REQUIRED, `Insufficient wallet balance. Required: ৳${costBDT.toFixed(2)}, Available: ৳${wallet.balanceBDT.toFixed(2)}, Shortfall: ৳${shortfall.toFixed(2)}. Please top up your wallet.`);
    }
    const previousBalance = wallet.balanceBDT;
    const promptTokens = Math.ceil(costEstimate.estimatedTokens / 2);
    const completionTokens = Math.floor(costEstimate.estimatedTokens / 2);
    let deductionResult;
    try {
        deductionResult = await wallet_service_1.WalletService.deductCredits(userId, {
            action: 'paraphrase',
            modelUsed: DEFAULT_MODEL,
            promptTokens,
            completionTokens,
            costBDT,
            creditsDeducted: costBDT,
        });
    }
    catch (deductErr) {
        throw new ApiError_1.default(http_status_1.default.PAYMENT_REQUIRED, deductErr.message || 'Could not deduct credits from wallet.');
    }
    let pythonResult;
    try {
        pythonResult = await callPythonParaphraser(payload, userId);
    }
    catch (aiError) {
        try {
            await wallet_service_1.WalletService.refundCredits(userId, {
                costBDT,
                tokensToRefund: costEstimate.estimatedTokens,
                reason: 'Paraphrase service failure auto-refund',
            });
            console.log(`[Paraphrase Auto-Refund] Successfully refunded ৳${costBDT} to user ${userId}.`);
        }
        catch (refundError) {
            console.error(`[CRITICAL: Paraphrase Refund Failed] Failed to refund ৳${costBDT} to user ${userId}:`, refundError);
        }
        throw aiError;
    }
    await incrementRateLimit(userId);
    try {
        await paraphrase_model_1.ParaphraseHistory.create({
            userId,
            originalText: payload.text,
            paraphrasedText: pythonResult.paraphrased_text,
            mode: payload.mode,
            providerUsed: pythonResult.provider_used,
            tokenUsage: pythonResult.token_usage,
            costBDT,
            durationSec: pythonResult.duration_sec,
        });
    }
    catch (histError) {
        console.error('[Paraphrase History Save Error]:', histError);
    }
    return {
        paraphrased_text: pythonResult.paraphrased_text,
        mode: payload.mode,
        provider_used: pythonResult.provider_used,
        duration_sec: pythonResult.duration_sec,
        token_usage: pythonResult.token_usage,
        costBDT,
        wallet: {
            previousBalance,
            deducted: costBDT,
            newBalance: deductionResult.wallet.balanceBDT,
        },
        auditLogId: deductionResult.auditLog?._id?.toString(),
    };
};
const getParaphraseHistory = async (userId, limit = 20) => {
    return await paraphrase_model_1.ParaphraseHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};
exports.ParaphraseService = {
    paraphraseText,
    estimateCost,
    getParaphraseHistory,
};
//# sourceMappingURL=paraphrase.service.js.map