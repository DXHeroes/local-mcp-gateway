/**
 * Prisma Service
 *
 * NestJS service wrapping Prisma Client with lifecycle management.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
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

    const tablenames = await this.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE '_prisma%'
      AND name NOT LIKE 'sqlite%'
    `;

    for (const { name } of tablenames) {
      await this.$executeRawUnsafe(`DELETE FROM "${name}"`);
    }
  }
}
