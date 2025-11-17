/**
 * Rate limiting middleware
 */

import rateLimit from 'express-rate-limit';
import { getEnv } from '../lib/env.js';

// Check if we're in development/test environment
// Use getEnv() to get default 'development' if NODE_ENV is not set
const isDevelopment = (() => {
  try {
    const env = getEnv();
    return env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  } catch {
    // If env validation fails, default to development mode (more permissive)
    return true;
  }
})();

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    // Skip rate limiting completely in development/test environment
    return isDevelopment;
  },
});

export const mcpProxyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 10000 : 60, // Much higher limit for development
  message: 'Too many MCP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    // Skip rate limiting completely in development/test environment
    return isDevelopment;
  },
});
