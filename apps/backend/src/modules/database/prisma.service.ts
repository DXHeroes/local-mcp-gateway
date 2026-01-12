/**
 * Prisma Service
 *
 * NestJS service wrapping Prisma Client with lifecycle management.
 */

import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

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

    // Create default profile
    const defaultProfile = await this.profile.create({
      data: {
        name: 'default',
        description: 'Default MCP profile for general use',
      },
    });
    this.logger.log(`Created default profile: ${defaultProfile.id}`);

    // Create Context7 MCP server
    const context7 = await this.mcpServer.create({
      data: {
        name: 'Context7',
        type: 'remote_http',
        config: JSON.stringify({ url: 'https://mcp.context7.com/mcp' }),
      },
    });
    this.logger.log(`Created Context7 MCP server: ${context7.id}`);

    // Link Context7 to default profile
    await this.profileMcpServer.create({
      data: {
        profileId: defaultProfile.id,
        mcpServerId: context7.id,
        order: 0,
      },
    });
    this.logger.log('Linked Context7 to default profile');

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
