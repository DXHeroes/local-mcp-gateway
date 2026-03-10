/**
 * Database connection and utilities using Prisma ORM
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/index.js';

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
 * Create a new Prisma Client instance
 * @returns PrismaClient instance
 */
export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
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
