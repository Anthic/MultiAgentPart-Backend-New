import { Request, Response } from 'express';
export declare const PaperController: {
    createPaper: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAllPapers: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getSinglePaper: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    updatePaper: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    deletePaper: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    addCitation: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
