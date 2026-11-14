import { z } from 'zod';

// Max lengths matter: bcrypt hashing of megabyte-sized "passwords" is a DoS.
const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254);

const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2).max(100),
    email,
    password: z.string({ required_error: 'Password is required' }).min(8).max(128),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string({ required_error: 'Password is required' }).min(1).max(128),
  }),
});

const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().max(2048).optional(),
    })
    .optional(),
});

export const AuthValidation = { registerSchema, loginSchema, refreshSchema };
