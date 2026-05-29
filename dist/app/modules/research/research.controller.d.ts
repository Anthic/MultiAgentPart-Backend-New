import { Request, Response } from 'express';
export declare const ResearchController: {
    startResearch: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getResearchQuota: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getJobStatus: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getResearchHistory: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getHistoryById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getCacheStats: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAgentHealth: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
