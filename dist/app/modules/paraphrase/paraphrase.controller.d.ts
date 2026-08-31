import { Request, Response } from 'express';
export declare const ParaphraseController: {
    paraphraseText: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getParaphraseHistory: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    estimateCost: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
