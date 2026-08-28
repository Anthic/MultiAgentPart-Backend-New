import { z } from 'zod';

const createNoteSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(2),
    content: z.string({ required_error: 'Content is required' }).min(1),
    sourceUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional().default([]),
    audioUrl: z.string().url().optional(),
  }),
});

const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    content: z.string().min(1).optional(),
    sourceUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    audioUrl: z.string().url().optional(),
  }),
});

export const NoteValidation = {
  createNoteSchema,
  updateNoteSchema,
};
