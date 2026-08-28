import { Request, Response } from 'express';
export declare const PaymentController: {
    initRecharge: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    successPayment: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    failPayment: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    cancelPayment: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    validateIPN: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
