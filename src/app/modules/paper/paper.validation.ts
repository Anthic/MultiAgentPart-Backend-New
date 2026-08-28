import { z } from 'zod';

const citationSchema = z.object({
  citationKey: z.string({ required_error: 'Citation key is required' }),
  title: z.string({ required_error: 'Title is required' }),
  url: z.string().url('Invalid citation URL'),
  doi: z.string().optional(),
  authors: z.array(z.string()).optional(),
  year: z.string().optional(),
});

const createPaperSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3),
    contentMarkdown: z.string().optional().default(''),
    abstract: z.string().optional().default(''),
    citations: z.array(citationSchema).optional().default([]),
    attachedNotes: z.array(z.string()).optional().default([]),
    status: z.enum(['draft', 'in_review', 'published', 'archived']).optional().default('draft'),
  }),
});

const updatePaperSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    contentMarkdown: z.string().optional(),
    abstract: z.string().optional(),
    citations: z.array(citationSchema).optional(),
    attachedNotes: z.array(z.string()).optional(),
    status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(),
  }),
});

export const PaperValidation = {
  createPaperSchema,
  updatePaperSchema,
};
