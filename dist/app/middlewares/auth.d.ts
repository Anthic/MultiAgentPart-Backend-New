import { NextFunction, Request, Response } from 'express';
export declare const auth: {
    authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
    authorizeRoles: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
    authorize: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
};
