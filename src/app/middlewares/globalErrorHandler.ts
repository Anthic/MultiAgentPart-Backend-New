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
    // Avoid logging known operational errors like 401 Unauthorized or 403 Forbidden to keep terminal clean
    const isOperationalError = error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
    if (!isOperationalError) {
      console.log(' globalErrorHandler ~~', error);
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
    errorMessages = error.message
      ? [
          {
            path: '',
            message: error.message,
          },
        ]
      : [];
  } else if (error instanceof MongooseError.ValidationError) {
    statusCode = httpStatus.UNPROCESSABLE_ENTITY;
    message = 'Validation error';
    errorMessages = Object.values(error.errors).map((err) => ({
      path: err.path,
      message: err.message,
    }));
  } else if (error instanceof MongooseError.CastError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid identifier';
    errorMessages = [
      {
        path: error.path,
        message: error.message,
      },
    ];
  } else if ((error as { code?: number }).code === 11000) {
    statusCode = httpStatus.CONFLICT;
    message = 'Duplicate value';
    errorMessages = [
      {
        path:
          Object.keys(
            (error as { keyValue?: Record<string, unknown> }).keyValue || {},
          )[0] || '',
        message: 'Duplicate value found',
      },
    ];
  } else if (error instanceof TokenExpiredError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Token expired';
    errorMessages = [{ path: '', message }];
  } else if (error instanceof JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Invalid token';
    errorMessages = [{ path: '', message }];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = error.message
      ? [
          {
            path: '',
            message: error.message,
          },
        ]
      : [];
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid JSON in request body';
    errorMessages = [{ path: '', message }];
  }

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errorMessages,
    stack: config.env !== 'production' ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
