/**
 * Profiles Service
 *
 * Business logic for profile management.
 */

import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProxyService } from '../proxy/proxy.service.js';
import { RESERVED_PROFILE_NAMES, SETTING_KEYS } from '../settings/settings.constants.js';

interface CreateProfileDto {
  name: string;
  description?: string | null;
}

interface UpdateProfileDto {
  name?: string;
  description?: string | null;
}

interface AddServerToProfileDto {
  mcpServerId: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateServerInProfileDto {
  order?: number;
  isActive?: boolean;
}

interface UpdateToolDto {
  toolName: string;
  isEnabled: boolean;
  customName?: string;
  customDescription?: string;
  customInputSchema?: unknown;
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ProxyService))
    private readonly proxyService: ProxyService
  ) {}

  /**
   * Validate profile name against reserved names
   */
  private validateProfileName(name: string): void {
    const lowerName = name.toLowerCase();
    if (RESERVED_PROFILE_NAMES.some((reserved) => reserved.toLowerCase() === lowerName)) {
      throw new ConflictException(`Profile name "${name}" is reserved for system use`);
    }
  }

  /**
   * Get all profiles
   */
  async findAll() {
    return this.prisma.profile.findMany({
      include: {
        mcpServers: {
          include: {
            mcpServer: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a specific profile by ID
   */
  async findById(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        mcpServers: {
          include: {
            mcpServer: true,
            tools: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    return profile;
  }

  /**
   * Get a specific profile by name
   */
  async findByName(name: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { name },
      include: {
        mcpServers: {
          include: {
            mcpServer: true,
            tools: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with name "${name}" not found`);
    }

    return profile;
  }

  /**
   * Create a new profile
   */
  async create(dto: CreateProfileDto) {
    // Validate against reserved names
    this.validateProfileName(dto.name);

    // Check for unique name
    const existing = await this.prisma.profile.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Profile with name "${dto.name}" already exists`);
    }

    return this.prisma.profile.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  /**
   * Update a profile
   */
  async update(id: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    // Validate new name against reserved names
    if (dto.name) {
      this.validateProfileName(dto.name);
    }

    // Check for unique name if changing
    if (dto.name && dto.name !== profile.name) {
      const existing = await this.prisma.profile.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Profile with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.profile.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a profile
   */
  async delete(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    // If deleting default profile, mark it as intentionally deleted
    if (profile.name === 'default') {
      await this.prisma.gatewaySetting.upsert({
        where: { key: SETTING_KEYS.DEFAULT_PROFILE_DELETED },
        update: { value: 'true' },
        create: { id: randomUUID(), key: SETTING_KEYS.DEFAULT_PROFILE_DELETED, value: 'true' },
      });
    }

    await this.prisma.profile.delete({ where: { id } });
  }

  /**
   * Get servers for a profile
   */
  async getServers(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    return this.prisma.profileMcpServer.findMany({
      where: { profileId },
      include: {
        mcpServer: true,
        tools: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * Add an MCP server to a profile
   */
  async addServer(profileId: string, dto: AddServerToProfileDto) {
    // Check profile exists
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Check server exists
    const server = await this.prisma.mcpServer.findUnique({ where: { id: dto.mcpServerId } });
    if (!server) {
      throw new NotFoundException(`MCP server ${dto.mcpServerId} not found`);
    }

    // Check if already linked
    const existing = await this.prisma.profileMcpServer.findUnique({
      where: {
        profileId_mcpServerId: {
          profileId,
          mcpServerId: dto.mcpServerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Server is already in this profile');
    }

    return this.prisma.profileMcpServer.create({
      data: {
        profileId,
        mcpServerId: dto.mcpServerId,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        mcpServer: true,
      },
    });
  }

  /**
   * Update a server in a profile
   */
  async updateServer(profileId: string, serverId: string, dto: UpdateServerInProfileDto) {
    const link = await this.prisma.profileMcpServer.findUnique({
      where: {
        profileId_mcpServerId: {
          profileId,
          mcpServerId: serverId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Server is not in this profile');
    }

    return this.prisma.profileMcpServer.update({
      where: { id: link.id },
      data: dto,
      include: {
        mcpServer: true,
      },
    });
  }

  /**
   * Remove a server from a profile
   */
  async removeServer(profileId: string, serverId: string) {
    const link = await this.prisma.profileMcpServer.findUnique({
      where: {
        profileId_mcpServerId: {
          profileId,
          mcpServerId: serverId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Server is not in this profile');
    }

    await this.prisma.profileMcpServer.delete({
      where: { id: link.id },
    });
  }

  /**
   * Get tools for a server in a profile with customizations
   */
  async getServerTools(profileId: string, serverId: string, _refresh = false) {
    // Check profile exists
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Check server link exists
    const link = await this.prisma.profileMcpServer.findUnique({
      where: {
        profileId_mcpServerId: {
          profileId,
          mcpServerId: serverId,
        },
      },
      include: {
        tools: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Server is not in this profile');
    }

    // Get tools from the MCP server
    const serverTools = await this.proxyService.getToolsForServer(serverId);

    // Apply customizations
    const tools = serverTools.map((tool) => {
      const customization = link.tools.find((t) => t.toolName === tool.name);

      return {
        name: tool.name,
        original: {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        customized: customization
          ? {
              name: customization.customName || tool.name,
              description: customization.customDescription || tool.description,
              inputSchema: tool.inputSchema,
            }
          : null,
        isEnabled: customization?.isEnabled ?? true,
        hasChanges: !!customization,
        changeType: customization ? 'modified' : 'unchanged',
      };
    });

    return { tools };
  }

  /**
   * Update tool customizations for a server in a profile
   */
  async updateServerTools(profileId: string, serverId: string, tools: UpdateToolDto[]) {
    // Check profile exists
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Check server link exists
    const link = await this.prisma.profileMcpServer.findUnique({
      where: {
        profileId_mcpServerId: {
          profileId,
          mcpServerId: serverId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Server is not in this profile');
    }

    // Use transaction to update tool customizations
    await this.prisma.$transaction(async (tx) => {
      // Delete existing tool customizations for this profile-server link
      await tx.profileMcpServerTool.deleteMany({
        where: { profileMcpServerId: link.id },
      });

      // Create new tool customizations (only for tools that have changes)
      const toolsToCreate = tools.filter(
        (tool) =>
          !tool.isEnabled || tool.customName || tool.customDescription || tool.customInputSchema
      );

      if (toolsToCreate.length > 0) {
        await tx.profileMcpServerTool.createMany({
          data: toolsToCreate.map((tool) => ({
            profileMcpServerId: link.id,
            toolName: tool.toolName,
            isEnabled: tool.isEnabled,
            customName: tool.customName || null,
            customDescription: tool.customDescription || null,
            customInputSchema: tool.customInputSchema
              ? JSON.stringify(tool.customInputSchema)
              : null,
          })),
        });
      }
    });

    // Return updated tools by calling getServerTools
    return this.getServerTools(profileId, serverId);
  }
}
