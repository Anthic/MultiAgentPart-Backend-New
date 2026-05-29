import { Request, Response, NextFunction } from 'express';
export declare const createCsrfTokenForRequest: (req: Request, res: Response) => string;
export declare const setCsrfToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const verifyCsrf: (req: Request, _res: Response, next: NextFunction) => void;
