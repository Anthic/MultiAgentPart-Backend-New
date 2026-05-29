import { Request, Response } from 'express';
export declare const UserController: {
    createUserByAdmin: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getUserById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    deleteUserById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    updateMe: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
