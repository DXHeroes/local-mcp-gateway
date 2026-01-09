/**
 * Database connection and utilities using Prisma ORM
 */

import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { PrismaClient } from './generated/prisma/index.js';

/**
 * Ensure the directory for the database file exists
 * @param filePath - Database file path
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Create a new Prisma Client instance
 * @returns PrismaClient instance
 */
export function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  // Extract file path from DATABASE_URL if it's a file URL
  if (databaseUrl?.startsWith('file:')) {
    const filePath = databaseUrl.replace('file:', '');
    if (!filePath.startsWith(':memory:') && !filePath.startsWith('./')) {
      ensureDirectoryExists(filePath);
    }
  }

  return new PrismaClient({
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
