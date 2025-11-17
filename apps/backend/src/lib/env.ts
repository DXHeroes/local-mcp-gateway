/**
 * Environment variable validation
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_PATH: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
  OAUTH_ENCRYPTION_KEY: z.string().min(32).optional(),
  SENTRY_DSN: z.union([z.string().url(), z.literal('')]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validate and return environment variables
 * @throws {z.ZodError} If validation fails
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Invalid environment variables. Please check your .env file.');
    }
    throw error;
  }
}
