import { z } from 'zod';

const createParaphraseSchema = z.object({
  body: z.object({
    text: z
      .string({ required_error: 'Text is required' })
      .min(10, 'Text must be at least 10 characters long')
      .max(20000, 'Text must not exceed 20,000 characters'),
    mode: z
      .enum(['academic', 'simplify', 'executive', 'humanize'], {
        errorMap: () => ({
          message: 'Mode must be one of: academic, simplify, executive, humanize',
        }),
      })
      .default('academic'),
  }),
});

export const ParaphraseValidation = {
  createParaphraseSchema,
};
