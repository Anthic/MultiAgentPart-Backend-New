import { z } from 'zod';

const startResearchSchema = z.object({
  body: z.object({
    topic: z
      .string({ required_error: 'Topic is required' })
      .min(3, 'Topic must be at least 3 characters long')
      .max(500, 'Topic must not exceed 500 characters'),
  }),
});

export const ResearchValidation = {
  startResearchSchema,
};