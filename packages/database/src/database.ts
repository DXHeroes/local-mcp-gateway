/**
 * Database connection and utilities using Prisma ORM
 */

import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/index.js';

/**
 * Ensure the directory for the database file exists
 * @param filePath - Database file path
 */
export function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get the database URL from environment variable
 * @returns Database URL string
 */
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return databaseUrl;
}

/**
 * Create a Prisma SQLite adapter with proper directory setup
 * @returns PrismaBetterSqlite3 adapter instance
 */
export function createPrismaAdapter(): PrismaBetterSqlite3 {
  const databaseUrl = getDatabaseUrl();

  // Ensure directory exists for file-based databases
  if (databaseUrl.startsWith('file:')) {
    const filePath = databaseUrl.replace('file:', '');
    if (!filePath.startsWith(':memory:')) {
      ensureDirectoryExists(filePath);
    }
  }

  return new PrismaBetterSqlite3({ url: databaseUrl });
}

/**
 * Create a new Prisma Client instance with SQLite adapter
 * @returns PrismaClient instance
 */
export function createPrismaClient(): PrismaClient {
  const adapter = createPrismaAdapter();

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

/**
 * Global Prisma Client instance (singleton)
 */
let prismaInstance: PrismaClient | null = null;

/**
 * Get the global Prisma Client instance (singleton pattern)
 * @returns PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }
  return prismaInstance;
}

/**
 * Disconnect the global Prisma Client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// Re-export PrismaClient class for direct use
export { PrismaClient };
