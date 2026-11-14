import rateLimit from 'express-rate-limit';
import config from '../../config';
import { Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { AuthenticatedRequest } from '../interfaces/auth';
import { Wallet } from '../modules/wallet/wallet.model';
import ApiError from '../errors/ApiError';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const windowMs = toNumber(config.rate_limit_window_ms, 15 * 60 * 1000);
const maxRequests = toNumber(config.rate_limit_max, 100);

// RESEARCH_DAILY_LIMIT was read into config but never used; honour it now.
// Default stays 1 so behaviour is unchanged unless the env var is set.
const FREE_DAILY_RESEARCH_LIMIT = Math.max(0, Math.floor(toNumber(config.research_daily_limit, 1)));
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

// Reserve one free-quota slot atomically. The old GET -> compare -> INCR ->
// EXPIRE sequence let N parallel requests all read "0 used" and all get a free
// run, and a crash between INCR and EXPIRE left a counter that never reset.
// Returns [newCount, ttl], or [-1, ttl] when the quota is already exhausted.
const RESERVE_QUOTA_LUA = `
local cur = tonumber(redis.call("GET", KEYS[1]) or "0")
if cur >= tonumber(ARGV[1]) then
  return {-1, redis.call("TTL", KEYS[1])}
end
local n = redis.call("INCR", KEYS[1])
if n == 1 or redis.call("TTL", KEYS[1]) < 0 then
  redis.call("EXPIRE", KEYS[1], ARGV[2])
end
return {n, redis.call("TTL", KEYS[1])}
`;

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

    const [count, ttl] = (await redis.eval(
      RESERVE_QUOTA_LUA,
      1,
      key,
      String(FREE_DAILY_RESEARCH_LIMIT),
      String(researchQuotaTtlSeconds),
    )) as [number, number];

    if (count > 0) {
      req.isFreeRequest = true;
      req.researchQuota = {
        limit: FREE_DAILY_RESEARCH_LIMIT,
        used: count,
        remaining: Math.max(FREE_DAILY_RESEARCH_LIMIT - count, 0),
        resetAt: getResetAt(Number(ttl)),
      };
      return next();
    }

    const quota: ResearchQuota = {
      limit: FREE_DAILY_RESEARCH_LIMIT,
      used: FREE_DAILY_RESEARCH_LIMIT,
      remaining: 0,
      resetAt: getResetAt(Number(ttl)),
    };

   
    const wallet = await Wallet.findOne({ userId });
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
      message: `Daily free trial limit (${FREE_DAILY_RESEARCH_LIMIT}/${FREE_DAILY_RESEARCH_LIMIT}) reached. Additional searches cost ৳${RESEARCH_COST_BDT}. Your balance: ৳${userBalance.toFixed(2)}. Please recharge via bKash/Nagad to continue.`,
      data: {
        quota,
        walletBalanceBDT: userBalance,
        requiredBDT: RESEARCH_COST_BDT,
      },
    });
    return;
  } catch (error) {
    // Fail CLOSED. Letting the request through when Redis (the quota store)
    // is down meant an outage handed out unlimited free, unmetered research.
    console.error('Rate limiter error:', error);
    next(new ApiError(503, 'Usage quota service is temporarily unavailable. Please retry shortly.'));
  }
};
