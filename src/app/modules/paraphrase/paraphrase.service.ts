import axios from 'axios';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { redis } from '../../../config/redis';
import { WalletService } from '../wallet/wallet.service';
import {
  IParaphraseRequest,
  IParaphraseResult,
  ITierLimits,
  SubscriptionTier,
  ICostEstimate,
  IParaphraseHistory,
} from './paraphrase.interface';
import { ParaphraseHistory } from './paraphrase.model';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://api-atlash.duckdns.org';
const PARAPHRASE_TIMEOUT_MS = Number(process.env.PARAPHRASE_TIMEOUT_MS) || 30000;
const DEFAULT_MODEL = process.env.PARAPHRASE_DEFAULT_MODEL || 'worker-groq';

// Subscription Tier Limits
const TIER_LIMITS: Record<SubscriptionTier, ITierLimits> = {
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

// Model Pricing (BDT per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'worker-groq': { input: 8, output: 24 },
  'worker-gemini': { input: 10, output: 30 },
  'worker-mistral': { input: 25, output: 75 },
};

/**
 * Calculate token and cost estimate in BDT
 */
const estimateCost = (text: string, model: string = DEFAULT_MODEL): ICostEstimate => {
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

/**
 * Check and enforce Redis rate limits based on user subscription tier
 */
const checkRateLimit = async (userId: string, tier: SubscriptionTier): Promise<void> => {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const currentDay = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const hourKey = `paraphrase:rate:${userId}:hour:${currentHour}`;
  const dayKey = `paraphrase:rate:${userId}:day:${currentDay}`;

  try {
    const [hourUsageStr, dayUsageStr] = await Promise.all([
      redis.get(hourKey),
      redis.get(dayKey),
    ]);

    const hourUsage = hourUsageStr ? parseInt(hourUsageStr, 10) : 0;
    const dayUsage = dayUsageStr ? parseInt(dayUsageStr, 10) : 0;

    if (hourUsage >= limits.MAX_REQUESTS_PER_HOUR) {
      const now = new Date();
      const minutesRemaining = 60 - now.getMinutes();
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        `Hourly rate limit reached for your ${tier} plan (${limits.MAX_REQUESTS_PER_HOUR} requests/hr). Limit resets in ${minutesRemaining} minutes.`,
      );
    }

    if (dayUsage >= limits.MAX_REQUESTS_PER_DAY) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        `Daily quota exceeded for your ${tier} plan (${limits.MAX_REQUESTS_PER_DAY} requests/day). Limit resets tomorrow.`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Log Redis error but allow fallback if redis is temporarily unreachable
    console.error('[Paraphrase Rate Limit Check Error]:', error);
  }
};

/**
 * Increment Redis rate limit counter after successful execution
 */
const incrementRateLimit = async (userId: string): Promise<void> => {
  const currentHour = new Date().toISOString().slice(0, 13);
  const currentDay = new Date().toISOString().slice(0, 10);

  const hourKey = `paraphrase:rate:${userId}:hour:${currentHour}`;
  const dayKey = `paraphrase:rate:${userId}:day:${currentDay}`;

  try {
    const multi = redis.multi();
    multi.incr(hourKey);
    multi.expire(hourKey, 3600); // 1 hour TTL
    multi.incr(dayKey);
    multi.expire(dayKey, 86400); // 24 hours TTL
    await multi.exec();
  } catch (error) {
    console.error('[Paraphrase Rate Limit Increment Error]:', error);
  }
};

/**
 * Call Python Agent API with retry logic and timeout
 */
const callPythonParaphraser = async (
  payload: IParaphraseRequest,
  userId: string,
): Promise<{
  paraphrased_text: string;
  mode: string;
  provider_used: string;
  duration_sec: number;
  token_usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}> => {
  const endpoint = `${PYTHON_API_URL.replace(/\/$/, '')}/api/v1/paraphrase`;
  let lastError: any = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(
        endpoint,
        {
          text: payload.text,
          mode: payload.mode,
          user_id: userId,
        },
        {
          timeout: PARAPHRASE_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AtlasAI-Backend/1.0',
          },
        },
      );

      const data = response.data;

      // Validate Python API response structure
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
          total_tokens:
            data.token_usage?.total_tokens ||
            (data.token_usage?.prompt_tokens || 0) + (data.token_usage?.completion_tokens || 0),
        },
      };
    } catch (error: any) {
      lastError = error;

      // Do not retry 4xx errors (client errors)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        break;
      }

      // If this wasn't the last attempt, wait with backoff
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      }
    }
  }

  // Handle timeout explicitly
  if (lastError?.code === 'ECONNABORTED' || lastError?.message?.includes('timeout')) {
    throw new ApiError(
      httpStatus.GATEWAY_TIMEOUT,
      'AI Paraphraser timed out. The service is taking longer than usual.',
    );
  }

  const message =
    lastError?.response?.data?.detail ||
    lastError?.response?.data?.message ||
    lastError?.message ||
    'AI Paraphraser engine failed to process the text.';

  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message);
};

/**
 * Main Paraphrase Execution Workflow
 */
const paraphraseText = async (
  userId: string,
  payload: IParaphraseRequest,
): Promise<IParaphraseResult> => {
  // 1. Retrieve User Wallet & Subscription Tier
  const wallet = await WalletService.getOrCreateWallet(userId);
  const tier: SubscriptionTier = (wallet.subscriptionTier as SubscriptionTier) || 'free';
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // 2. Enforce Tier-Based Character Limits
  const textLength = payload.text.trim().length;
  if (textLength > limits.MAX_CHARACTERS) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Character limit exceeded. Your ${tier} tier allows up to ${limits.MAX_CHARACTERS} characters (you provided ${textLength} characters). Upgrade your plan to increase limits.`,
    );
  }

  // 3. Enforce Redis Rate Limits (Hourly & Daily)
  await checkRateLimit(userId, tier);

  // 4. Calculate Cost Estimate
  const costEstimate = estimateCost(payload.text);
  const costBDT = costEstimate.estimatedCostBDT;

  // 5. Verify Balance
  if (wallet.balanceBDT < costBDT) {
    const shortfall = Number((costBDT - wallet.balanceBDT).toFixed(4));
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `Insufficient wallet balance. Required: ৳${costBDT.toFixed(2)}, Available: ৳${wallet.balanceBDT.toFixed(2)}, Shortfall: ৳${shortfall.toFixed(2)}. Please top up your wallet.`,
    );
  }

  // 6. Pre-deduct credits atomically
  const previousBalance = wallet.balanceBDT;
  const promptTokens = Math.ceil(costEstimate.estimatedTokens / 2);
  const completionTokens = Math.floor(costEstimate.estimatedTokens / 2);

  let deductionResult: { wallet: any; auditLog: any };
  try {
    deductionResult = await WalletService.deductCredits(userId, {
      action: 'paraphrase',
      modelUsed: DEFAULT_MODEL,
      promptTokens,
      completionTokens,
      costBDT,
      creditsDeducted: costBDT,
    });
  } catch (deductErr: any) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      deductErr.message || 'Could not deduct credits from wallet.',
    );
  }

  // 7. Call Python Agent API with Auto-Refund on Failure
  let pythonResult: {
    paraphrased_text: string;
    mode: string;
    provider_used: string;
    duration_sec: number;
    token_usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  try {
    pythonResult = await callPythonParaphraser(payload, userId);
  } catch (aiError: any) {
    // 8. Auto-Refund exact deducted amount on failure
    try {
      await WalletService.refundCredits(userId, {
        costBDT,
        tokensToRefund: costEstimate.estimatedTokens,
        reason: 'Paraphrase service failure auto-refund',
      });
      console.log(`[Paraphrase Auto-Refund] Successfully refunded ৳${costBDT} to user ${userId}.`);
    } catch (refundError) {
      console.error(
        `[CRITICAL: Paraphrase Refund Failed] Failed to refund ৳${costBDT} to user ${userId}:`,
        refundError,
      );
    }

    throw aiError;
  }

  // 9. Increment Rate Limits on Success
  await incrementRateLimit(userId);

  // 10. Persist to Paraphrase History
  try {
    await ParaphraseHistory.create({
      userId,
      originalText: payload.text,
      paraphrasedText: pythonResult.paraphrased_text,
      mode: payload.mode,
      providerUsed: pythonResult.provider_used,
      tokenUsage: pythonResult.token_usage,
      costBDT,
      durationSec: pythonResult.duration_sec,
    });
  } catch (histError) {
    console.error('[Paraphrase History Save Error]:', histError);
  }

  // 11. Format & Return Final Response
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

/**
 * Get User Paraphrase History
 */
const getParaphraseHistory = async (
  userId: string,
  limit: number = 20,
): Promise<IParaphraseHistory[]> => {
  return await ParaphraseHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const ParaphraseService = {
  paraphraseText,
  estimateCost,
  getParaphraseHistory,
};
