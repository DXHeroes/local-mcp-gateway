/**
 * Prisma Service
 *
 * NestJS service wrapping Prisma Client with lifecycle management.
 */

import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected');

    // Seed default data on first run
    await this.seedDefaultData();
  }

  /**
   * Seed default data if database is empty (first run only)
   * Only seeds if no profiles exist - respects user data
   */
  private async seedDefaultData() {
    // Check if any profiles exist - if so, user has data, don't seed
    const profileCount = await this.profile.count();
    if (profileCount > 0) {
      this.logger.debug('Database has existing data, skipping seed');
      return;
    }

    this.logger.log('First run detected, seeding default data...');

    // Create default profile (system-level, no user/org)
    const defaultProfile = await this.profile.create({
      data: {
        name: 'default',
        description: 'Default MCP profile for general use',
      },
    });
    this.logger.log(`Created default profile: ${defaultProfile.id}`);

    // MCP servers are per-user — users add them from the presets gallery
    this.logger.log('Default data seeding complete');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Clean database (for testing only)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be called in test environment');
    }

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma%'
    `;

    for (const { tablename } of tablenames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
    }
  }
}
