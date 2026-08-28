"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperValidation = void 0;
const zod_1 = require("zod");
const citationSchema = zod_1.z.object({
    citationKey: zod_1.z.string({ required_error: 'Citation key is required' }),
    title: zod_1.z.string({ required_error: 'Title is required' }),
    url: zod_1.z.string().url('Invalid citation URL'),
    doi: zod_1.z.string().optional(),
    authors: zod_1.z.array(zod_1.z.string()).optional(),
    year: zod_1.z.string().optional(),
});
const createPaperSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }).min(3),
        contentMarkdown: zod_1.z.string().optional().default(''),
        abstract: zod_1.z.string().optional().default(''),
        citations: zod_1.z.array(citationSchema).optional().default([]),
        attachedNotes: zod_1.z.array(zod_1.z.string()).optional().default([]),
        status: zod_1.z.enum(['draft', 'in_review', 'published', 'archived']).optional().default('draft'),
    }),
});
const updatePaperSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        contentMarkdown: zod_1.z.string().optional(),
        abstract: zod_1.z.string().optional(),
        citations: zod_1.z.array(citationSchema).optional(),
        attachedNotes: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
    }),
});
exports.PaperValidation = {
    createPaperSchema,
    updatePaperSchema,
};
//# sourceMappingURL=paper.validation.js.map