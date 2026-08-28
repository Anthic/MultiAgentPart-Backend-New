import { Request, Response } from 'express';
export declare const WalletController: {
    getMyWallet: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAuditLogs: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    addFunds: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
