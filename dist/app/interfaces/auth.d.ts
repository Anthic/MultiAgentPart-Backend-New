import { Role } from '../constants/role';
import { Request } from 'express';
export type IAuthUserPayload = {
    userId: string;
    role: Role;
    email: string;
};
export interface AuthenticatedRequest extends Request {
    user?: IAuthUserPayload;
    researchQuota?: {
        limit: number;
        used: number;
        remaining: number;
        resetAt: string | null;
    };
}
