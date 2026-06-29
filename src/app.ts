import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import   httpStatus  from 'http-status';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { sanitizeMiddleware } from './app/middlewares/sanitize.middleware';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import routes from './app/routes';
import { apiRateLimiter, authRateLimiter } from './app/middlewares/rateLimiter';
import config from './config';
import { createCsrfTokenForRequest, setCsrfToken, verifyCsrf } from './app/middlewares/csrf.middleware';
import compression from 'compression';

const app: Application = express();

app.set('trust proxy', 1);

// Express 5 Compatibility: Make req.query and req.params writable
app.use((req: Request, _res: Response, next: NextFunction) => {
  const query = req.query;
  const params = req.params;
  Object.defineProperty(req, 'query', {
    value: query,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(req, 'params', {
    value: params,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  next();
});

// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use(
  cors({
    origin: config.cors_origin ? config.cors_origin.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());

// CSRF bootstrap — sets csrf_token cookie on GET requests (used by same-origin clients)
app.use(setCsrfToken)

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

app.use(helmet());
app.use(mongoSanitize());
app.use(sanitizeMiddleware);
app.use(apiRateLimiter);

// Application Routes
app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1', routes);

// Testing route
app.get('/', (_req: Request, res: Response) => {
  res.send('MultiAgent backend is running!');
});

// Global error handler
app.use(globalErrorHandler);

// Handle not found routes
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    statusCode: httpStatus.NOT_FOUND,
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
});

export default app;
