/**
 * MCP Seed Service
 *
 * Seeds MCP server records from discovered builtin packages.
 * External MCP presets are now available via the gallery API instead.
 */

import { randomUUID } from 'node:crypto';
import type { DiscoveredMcpPackage } from '@dxheroes/local-mcp-core';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface McpServerConfig {
  builtinId?: string;
}

@Injectable()
export class McpSeedService {
  private readonly logger = new Logger(McpSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run seed data for all discovered MCP packages
   *
   * Seeding is idempotent - only creates records that don't exist
   */
  async runSeeds(packages: DiscoveredMcpPackage[]): Promise<void> {
    this.logger.log(`Running seeds for ${packages.length} MCP packages`);

    for (const { package: pkg, packageName } of packages) {
      try {
        await this.seedPackage(pkg, packageName);
      } catch (error) {
        this.logger.error(`Failed to seed ${packageName}: ${error}`);
      }
    }

    this.logger.log('MCP seeding complete');
  }

  private async seedPackage(
    pkg: DiscoveredMcpPackage['package'],
    _packageName: string
  ): Promise<void> {
    const { metadata } = pkg;

    // Check if MCP server already exists (by builtinId in config)
    const existingServer = await this.findServerByBuiltinId(metadata.id);

    if (existingServer) {
      this.logger.debug(`MCP server ${metadata.id} already exists, skipping seed`);
      return;
    }

    // Create the MCP server record (system-level, no org)
    await this.prisma.mcpServer.create({
      data: {
        id: randomUUID(),
        name: metadata.name,
        type: 'builtin',
        config: JSON.stringify({ builtinId: metadata.id }),
        organizationId: null,
      },
    });

    this.logger.log(`Created MCP server: ${metadata.name} (${metadata.id})`);
  }

  private async findServerByBuiltinId(builtinId: string): Promise<boolean> {
    const servers = await this.prisma.mcpServer.findMany({
      where: { type: 'builtin' },
    });

    return servers.some((s) => {
      try {
        const config = JSON.parse(s.config as string) as McpServerConfig;
        return config.builtinId === builtinId;
      } catch {
        return false;
      }
    });
  }
}
