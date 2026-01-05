/**
 * Better Auth Configuration
 *
 * Production-ready authentication with:
 * - Email/password authentication
 * - Email verification
 * - Password reset
 * - Two-Factor Authentication (2FA/TOTP)
 * - OAuth providers (Google, GitHub)
 * - Session management
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';
import { db } from './db.js';
import { users, session, account, verification, twoFactor as twoFactorTable } from '@dxheroes/local-mcp-database';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './email.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: users,
      session,
      account,
      verification,
      twoFactor: twoFactorTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Optional - can be changed to true to force verification
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url, user.name);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url, user.name);
    },
    sendOnSignUp: true, // Automatically send verification email on sign up
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  },
  plugins: [
    twoFactor({
      issuer: 'Local MCP Gateway',
      otpOptions: {
        period: 30,
      },
    }),
  ],
  // Optional: Add rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // max 10 requests per minute per IP
  },
});

export type Auth = typeof auth;
