import { z } from 'zod';

// .strict() rejects unknown keys outright, so a client can never smuggle
// role / id / balance style fields into a profile update.
const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().toLowerCase().email().max(254).optional(),
    })
    .strict(),
});

const createUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(8).max(128),
      role: z.enum(['admin', 'user']).optional(),
    })
    .strict(),
});

export const UserValidation = { updateMeSchema, createUserSchema };
