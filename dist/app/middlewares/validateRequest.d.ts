import { AnyZodObject } from 'zod';
import { NextFunction, Request, Response } from 'express';
declare const validateRequest: (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default validateRequest;
