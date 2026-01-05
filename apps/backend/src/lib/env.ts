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

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'Better Auth secret must be at least 32 characters').optional(),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(), // Format: "Name <email@example.com>" or just email

  // OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Paddle payment provider
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),

  // License key signing (Ed25519 keys in hex format - 64 chars each)
  LICENSE_PRIVATE_KEY: z.string().length(64, 'License private key must be 64 hex characters').optional(),
  LICENSE_PUBLIC_KEY: z.string().length(64, 'License public key must be 64 hex characters').optional(),
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
