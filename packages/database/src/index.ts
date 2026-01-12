/**
 * Database package exports
 *
 * Provides:
 * - Prisma Client for database operations
 * - Database connection utilities
 *
 * For Zod schemas, import from the subpath export:
 *   import * as zodSchemas from '@dxheroes/local-mcp-database/generated/zod';
 */

// Database connection utilities
export * from './database.js';

// Re-export generated Prisma Client types and models
// Use this for database operations and types
export * from './generated/prisma/index.js';
