import rateLimit from 'express-rate-limit';
import config from '../../config';
import { Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { AuthenticatedRequest } from '../interfaces/auth';
import { Wallet } from '../modules/wallet/wallet.model';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const windowMs = toNumber(config.rate_limit_window_ms, 15 * 60 * 1000);
const maxRequests = toNumber(config.rate_limit_max, 100);

const FREE_DAILY_RESEARCH_LIMIT = 1;
const RESEARCH_COST_BDT = 10.0;
const researchQuotaTtlSeconds = 24 * 60 * 60;

export type ResearchQuota = {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
};

const researchQuotaKey = (userId: string): string => `research_quota:${userId}`;

const getResetAt = (ttlSeconds: number): string | null => {
  if (ttlSeconds <= 0) return null;
  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
};

export const getResearchQuota = async (userId: string): Promise<ResearchQuota> => {
  const key = researchQuotaKey(userId);
  const [current, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);
  const used = Math.min(parseInt(current ?? '0', 10), FREE_DAILY_RESEARCH_LIMIT);

  return {
    limit: FREE_DAILY_RESEARCH_LIMIT,
    used,
    remaining: Math.max(FREE_DAILY_RESEARCH_LIMIT - used, 0),
    resetAt: getResetAt(ttl),
  };
};

export const refundResearchQuota = async (userId: string): Promise<void> => {
  const key = researchQuotaKey(userId);
  await redis.eval(
    `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    if current > 0 then
      return redis.call("DECR", KEYS[1])
    else
      return 0
    end
    `,
    1,
    key
  );
};

export const apiRateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs,
  max: Math.max(10, Math.floor(maxRequests / 5)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
  },
});

// 🛡️ হাইব্রিড ফ্রি-কোটা ও ওয়ালেট পেমেন্ট গার্ড
export const aiRequestLimiter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }

  try {
    const userId = req.user.userId;
    const key = researchQuotaKey(userId);

    // ১. Redis থেকে আজকের ফ্রি ইউসেজ চেক করুন
    const currentUsageStr = await redis.get(key);
    const ttl = await redis.ttl(key);
    const currentUsage = parseInt(currentUsageStr || '0', 10);

    const quota: ResearchQuota = {
      limit: FREE_DAILY_RESEARCH_LIMIT,
      used: Math.min(currentUsage, FREE_DAILY_RESEARCH_LIMIT),
      remaining: Math.max(FREE_DAILY_RESEARCH_LIMIT - currentUsage, 0),
      resetAt: getResetAt(Number(ttl)),
    };

    // 🟢 কেস ১: ইউজারের ১টি ফ্রি কোটা বাকি আছে
    if (currentUsage < FREE_DAILY_RESEARCH_LIMIT) {
      await redis.incr(key);
      if (currentUsage === 0) {
        await redis.expire(key, researchQuotaTtlSeconds);
      }
      req.isFreeRequest = true;
      req.researchQuota = quota;
      return next();
    }

    // 🟡 কেস ২: ফ্রি কোটা শেষ -> ওয়ালেটে টাকা আছে কি না চেক করুন
    const wallet = await Wallet.findOne({ userId });
    const userBalance = wallet?.balanceBDT || 0;

    if (wallet && userBalance >= RESEARCH_COST_BDT) {
      // ✅ ওয়ালেটে টাকা আছে -> পে-অ্যাজ-ইউ-গো হিসেবে পাস করুন (কন্ট্রোলারে ৳১৫ কাটা হবে)
      req.isFreeRequest = false;
      req.chargeAmountBDT = RESEARCH_COST_BDT;
      req.researchQuota = quota;
      return next();
    }

    // 🔴 কেস ৩: ফ্রি কোটাও শেষ এবং ওয়ালেটে পর্যাপ্ত টাকাও নেই
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
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};
