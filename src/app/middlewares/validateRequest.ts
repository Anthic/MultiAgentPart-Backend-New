import { AnyZodObject } from 'zod';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod/v4';
import ApiError from '../errors/ApiError';
import httpStatus from 'http-status';
const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((e) => e.message).join(', ');
        next(new ApiError(httpStatus.BAD_REQUEST, message));
      } else {
        next(err);
      }
    }
  };
};
export default validateRequest;
