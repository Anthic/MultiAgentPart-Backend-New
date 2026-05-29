import { Request, Response, NextFunction } from 'express';

function stripHtml(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) return value.map(stripHtml);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        stripHtml(v),
      ]),
    );
  }
  return value;
}

export const sanitizeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.body) {
    req.body = stripHtml(req.body);
  }

  if (req.query) {
    const sanitizedQuery = stripHtml(req.query);
    // Express 5 req.query is a getter, we should not reassign it directly
    // Clear and re-populate to avoid the getter issue
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });
    Object.assign(req.query, sanitizedQuery);
  }

  if (req.params) {
    const sanitizedParams = stripHtml(req.params);
    Object.keys(req.params).forEach((key) => {
      delete req.params[key];
    });
    Object.assign(req.params, sanitizedParams);
  }

  next();
};
