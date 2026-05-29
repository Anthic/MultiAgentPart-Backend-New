import rateLimit from 'express-rate-limit';
import config from '../../config';

import { Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { AuthenticatedRequest } from '../interfaces/auth';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const windowMs = toNumber(config.rate_limit_window_ms, 15 * 60 * 1000);
const maxRequests = toNumber(config.rate_limit_max, 100);
const researchDailyLimit = toNumber(config.research_daily_limit, 3);
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
  const used = Math.min(parseInt(current ?? '0',10), researchDailyLimit);

  return {
    limit: researchDailyLimit,
    used,
    remaining: Math.max(researchDailyLimit - used, 0),
    resetAt: getResetAt(ttl),
  };
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

export const aiRequestLimiter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  //user na thakle skip
  if (!req.user) {
    next();
    return;
  }

  try {
    const userId = req.user.userId;
    const key = researchQuotaKey(userId);

    const result = (await redis.eval(
      `
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
      `,
      1,
      key,
      researchDailyLimit,
      researchQuotaTtlSeconds,
    )) as [number, number, number];

    const [allowed, rawUsed, ttl] = result;
    const used = Math.min(Number(rawUsed), researchDailyLimit);
    const quota: ResearchQuota = {
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
    
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};
