import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:5001/api'),
});

const result = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  const messages = Object.entries(errors)
    .map(([field, msgs]) => `  ${field}: ${(msgs as string[]).join(', ')}`)
    .join('\n');
  throw new Error(`\n[env] Invalid environment variables:\n${messages}\n`);
}

export const env = result.data;
