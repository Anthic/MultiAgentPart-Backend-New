import { z } from 'zod';

// Limits mirror the Python agent service (MAX_DOC_CHARS = 60000).
const MAX_DOC = 60000;

const peerReviewSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(500),
    content: z.string().min(20).max(MAX_DOC),
  }),
});

const slidesSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(500),
    content: z.string().max(MAX_DOC).optional(),
    num_slides: z.number().int().min(5).max(15).optional(),
  }),
});

const gapFinderSchema = z.object({
  body: z.object({
    topic: z.string().min(3).max(1000),
    literature_context: z.string().max(MAX_DOC).optional(),
  }),
});

const draftSectionSchema = z.object({
  body: z.object({
    section_topic: z.string().min(3).max(1000),
    instructions: z.string().max(2000).optional(),
  }),
});

export const AcademicValidation = {
  peerReviewSchema,
  slidesSchema,
  gapFinderSchema,
  draftSectionSchema,
};
