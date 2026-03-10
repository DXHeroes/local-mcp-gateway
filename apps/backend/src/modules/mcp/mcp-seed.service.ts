/**
 * MCP Seed Service
 *
 * Seeds MCP server records from discovered packages and external presets.
 */

import { randomUUID } from 'node:crypto';
import type { DiscoveredMcpPackage, ExternalMcpConfig } from '@dxheroes/local-mcp-core';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SETTING_KEYS } from '../settings/settings.constants.js';

interface McpServerConfig {
  builtinId?: string;
}

/**
 * External MCP server presets - popular NPX-based MCP servers
 * These are seeded but NOT assigned to any profile
 */
interface ExternalMcpPreset {
  name: string;
  description: string;
  config: ExternalMcpConfig;
}

const EXTERNAL_MCP_PRESETS: ExternalMcpPreset[] = [
  {
    name: 'Playwright MCP',
    description:
      'Browser automation with Playwright - page interactions, screenshots, PDF generation',
    config: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
      autoRestart: true,
    },
  },
  {
    name: 'Sequential Thinking',
    description:
      'Dynamic problem-solving through structured thoughts - analysis, planning, revision',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      autoRestart: true,
    },
  },
  {
    name: 'Filesystem MCP',
    description: 'File system access - read, write, search, and manage files',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      autoRestart: true,
    },
  },
  {
    name: 'Memory MCP',
    description:
      'Knowledge graph-based persistent memory - store and retrieve entities and relations',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      autoRestart: true,
    },
  },
  {
    name: 'GitHub MCP',
    description: 'GitHub API access - repositories, issues, pull requests, and more',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      autoRestart: true,
    },
  },
];

@Injectable()
export class McpSeedService {
  private readonly logger = new Logger(McpSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run seed data for all discovered MCP packages and external presets
   *
   * Seeding is idempotent - only creates records that don't exist
   */
  async runSeeds(packages: DiscoveredMcpPackage[]): Promise<void> {
    this.logger.log(`Running seeds for ${packages.length} MCP packages`);

    // Ensure default profile exists
    await this.ensureDefaultProfile();

    // Seed builtin packages
    for (const { package: pkg, packageName } of packages) {
      try {
        await this.seedPackage(pkg, packageName);
      } catch (error) {
        this.logger.error(`Failed to seed ${packageName}: ${error}`);
      }
    }

    // Seed external presets
    await this.seedExternalPresets();

    this.logger.log('MCP seeding complete');
  }

  /**
   * Seed external MCP server presets
   * These are NOT assigned to any profile - users manually add them
   */
  private async seedExternalPresets(): Promise<void> {
    this.logger.log(`Seeding ${EXTERNAL_MCP_PRESETS.length} external MCP presets`);

    for (const preset of EXTERNAL_MCP_PRESETS) {
      try {
        // Check if this external server already exists (by name)
        const existingServer = await this.prisma.mcpServer.findFirst({
          where: {
            name: preset.name,
            type: 'external',
          },
        });

        if (existingServer) {
          this.logger.debug(`External preset ${preset.name} already exists, skipping`);
          continue;
        }

        // Create the external MCP server record
        await this.prisma.mcpServer.create({
          data: {
            id: randomUUID(),
            name: preset.name,
            type: 'external',
            config: JSON.stringify(preset.config),
          },
        });

        this.logger.log(`Created external MCP preset: ${preset.name}`);
      } catch (error) {
        this.logger.error(`Failed to seed external preset ${preset.name}: ${error}`);
      }
    }
  }

  private async ensureDefaultProfile(): Promise<void> {
    // Check if user intentionally deleted the default profile
    const deletedSetting = await this.prisma.gatewaySetting.findUnique({
      where: { key: SETTING_KEYS.DEFAULT_PROFILE_DELETED },
    });

    if (deletedSetting?.value === 'true') {
      this.logger.log('Default profile was deleted by user, skipping creation');
      return;
    }

    const defaultProfile = await this.prisma.profile.findUnique({
      where: { name: 'default' },
    });

    if (!defaultProfile) {
      await this.prisma.profile.create({
        data: {
          id: randomUUID(),
          name: 'default',
          description: 'Default MCP profile',
        },
      });
      this.logger.log('Created default profile');
    }
  }

  private async seedPackage(
    pkg: DiscoveredMcpPackage['package'],
    _packageName: string
  ): Promise<void> {
    const { metadata, seed } = pkg;

    // Check if MCP server already exists (by builtinId in config)
    const existingServer = await this.findServerByBuiltinId(metadata.id);

    if (existingServer) {
      this.logger.debug(`MCP server ${metadata.id} already exists, skipping seed`);
      return;
    }

    // Create the MCP server record
    const serverId = randomUUID();

    await this.prisma.mcpServer.create({
      data: {
        id: serverId,
        name: metadata.name,
        type: 'builtin',
        config: JSON.stringify({ builtinId: metadata.id }),
      },
    });

    this.logger.log(`Created MCP server: ${metadata.name} (${metadata.id})`);

    // Link to profile if seed config specifies
    if (seed?.defaultProfile) {
      const profile = await this.prisma.profile.findUnique({
        where: { name: seed.defaultProfile },
      });

      if (profile) {
        await this.prisma.profileMcpServer.create({
          data: {
            id: randomUUID(),
            profileId: profile.id,
            mcpServerId: serverId,
            order: seed.defaultOrder ?? 0,
            isActive: seed.defaultActive ?? true,
          },
        });

        this.logger.log(`Linked ${metadata.name} to profile: ${seed.defaultProfile}`);
      }
    }
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
