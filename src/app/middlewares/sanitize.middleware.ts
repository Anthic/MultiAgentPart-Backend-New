import { Request, Response, NextFunction } from 'express';

// Fields that must reach the handler byte-for-byte:
//  - credentials/tokens: stripping '<...>' silently changed passwords, so a
//    password containing e.g. "a<b>c" could never log in again;
//  - free-form document/code text, where '<tag>' is legitimate content. These
//    are escaped by the React front end on render, not mangled on the way in.
const RAW_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'refreshToken',
  'accessToken',
  'token',
  'val_id',
  'content',
  'contentMarkdown',
  'text',
  'abstract',
  'slidesMarkdown',
  'literature_context',
  'instructions',
]);

// Only remove things that really are HTML tags (<b>, </script>, <img ...>);
// "a < b and c > d" is left alone instead of being eaten.
const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;

function stripHtml(value: unknown, key?: string): unknown {
  if (key && RAW_KEYS.has(key)) return value;
  if (typeof value === 'string') {
    return value.replace(TAG_RE, '').trim();
  }
  if (Array.isArray(value)) return value.map((v) => stripHtml(v, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        stripHtml(v, k),
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
