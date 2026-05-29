"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMiddleware = void 0;
function stripHtml(value) {
    if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '').trim();
    }
    if (Array.isArray(value))
        return value.map(stripHtml);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [
            k,
            stripHtml(v),
        ]));
    }
    return value;
}
const sanitizeMiddleware = (req, _res, next) => {
    if (req.body) {
        req.body = stripHtml(req.body);
    }
    if (req.query) {
        const sanitizedQuery = stripHtml(req.query);
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
exports.sanitizeMiddleware = sanitizeMiddleware;
//# sourceMappingURL=sanitize.middleware.js.map