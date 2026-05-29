import { IAuthUserPayload } from '../app/interfaces/auth';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUserPayload;
      researchQuota?: {
        limit: number;
        used: number;
        remaining: number;
        resetAt: string | null;
      };
    }
  }
}

export {};
