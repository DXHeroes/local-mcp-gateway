/**
 * Database package exports
 *
 * Provides:
 * - Prisma Client for database operations
 * - Generated Zod schemas for validation
 * - Generated TypeScript types
 */

// Database connection utilities
export * from './database.js';

// Re-export generated Prisma Client types and models
// Use this for database operations and types
export * from './generated/prisma/index.js';

// Re-export Zod schemas as a namespace to avoid conflicts
// Use these for input validation
export * as zodSchemas from './generated/zod/index.js';
