import { Request, Response } from 'express';
export declare const NoteController: {
    createNote: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAllNotes: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getSingleNote: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    updateNote: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    deleteNote: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAllTags: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
