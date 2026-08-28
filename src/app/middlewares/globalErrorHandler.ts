import { ErrorRequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import httpStatus from 'http-status';
import config from '../../config';
import { IGenericErrorMessage } from '../interfaces/error';
import ApiError from '../errors/ApiError';

const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (config.env === 'development') {
    const isOperational = error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
    if (!isOperational) {
      console.error('[Global Error]', error);
    }
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorMessages: IGenericErrorMessage[] = [];

  if (error instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Validation error';
    errorMessages = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message ? [{ path: '', message: error.message }] : [];
  } else if (error instanceof MongooseError.ValidationError) {
    statusCode = httpStatus.UNPROCESSABLE_ENTITY;
    message = 'Database validation failed';
    errorMessages = Object.values(error.errors).map((err) => ({
      path: err.path,
      message: err.message,
    }));
  } else if (error instanceof MongooseError.CastError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid resource identifier';
    errorMessages = [{ path: error.path, message: error.message }];
  } else if ((error as { code?: number }).code === 11000) {
    statusCode = httpStatus.CONFLICT;
    message = 'Duplicate record found';
    errorMessages = [{ path: '', message: 'A record with this unique value already exists' }];
  } else if (error instanceof TokenExpiredError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Token has expired';
    errorMessages = [{ path: '', message: 'Token has expired, please log in again' }];
  } else if (error instanceof JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Invalid authentication token';
    errorMessages = [{ path: '', message: 'Token is malformed or invalid' }];
  }

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errorMessages,
    stack: config.env === 'development' ? error.stack : undefined,
  });
};

export default globalErrorHandler;
