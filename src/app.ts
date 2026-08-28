import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';

import config from './config';
import routes from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { apiRateLimiter, authRateLimiter } from './app/middlewares/rateLimiter';
import { sanitizeMiddleware } from './app/middlewares/sanitize.middleware';
import { securityHeaders } from './app/middlewares/security.middleware';
import { requestIdMiddleware } from './app/middlewares/requestId.middleware';
import { createCsrfTokenForRequest, setCsrfToken, verifyCsrf } from './app/middlewares/csrf.middleware';

const app: Application = express();

app.set('trust proxy', 1);


app.use(requestIdMiddleware);


app.use(securityHeaders);


app.use((req: Request, _res: Response, next: NextFunction) => {
  const query = req.query;
  const params = req.params;
  Object.defineProperty(req, 'query', { value: query, writable: true, enumerable: true, configurable: true });
  Object.defineProperty(req, 'params', { value: params, writable: true, enumerable: true, configurable: true });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(
  cors({
    origin: config.cors_origin ? config.cors_origin.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());


app.use(mongoSanitize());
app.use(sanitizeMiddleware);


app.use(setCsrfToken);
app.get('/api/v1/csrf-token', (req: Request, res: Response) => {
  const token = createCsrfTokenForRequest(req, res);
  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'CSRF token generated successfully',
    data: { csrfToken: token },
  });
});
app.use(verifyCsrf);


app.use(apiRateLimiter);


app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1', routes);


app.get('/', (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'AtlashAI Multi-Agent API Engine is active and healthy',
    timestamp: new Date().toISOString(),
  });
});


app.use(globalErrorHandler);


app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    statusCode: httpStatus.NOT_FOUND,
    success: false,
    message: 'API Route Not Found',
    errorMessages: [{ path: req.originalUrl, message: `Route ${req.method} ${req.originalUrl} does not exist` }],
  });
});

export default app;
