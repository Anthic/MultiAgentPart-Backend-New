import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../interfaces/auth';
export type ResearchQuota = {
    limit: number;
    used: number;
    remaining: number;
    resetAt: string | null;
};
export declare const getResearchQuota: (userId: string) => Promise<ResearchQuota>;
export declare const refundResearchQuota: (userId: string) => Promise<void>;
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const aiRequestLimiter: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
