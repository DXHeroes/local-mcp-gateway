/**
 * Profiles Service
 *
 * Business logic for profile management.
 * All queries are scoped to the individual user (per-user ownership).
 * Shared profiles are visible via the SharingService.
 * Every profile MUST have a non-null userId and organizationId.
 */

import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { ProxyService } from '../proxy/proxy.service.js';
import { RESERVED_PROFILE_NAMES } from '../settings/settings.constants.js';
import { SharingService } from '../sharing/sharing.service.js';

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
    private readonly proxyService: ProxyService,
    private readonly sharingService: SharingService
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
   * Assert the user can read this profile (owner or shared)
   */
  private async assertAccess(profileId: string, userId: string, _orgId: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true, organizationId: true },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    // Owner — always allowed
    if (profile.userId === userId) return;

    // Check sharing
    const shared = await this.sharingService.isSharedWith('profile', profileId, userId, []);
    if (shared) return;

    throw new ForbiddenException('You do not have access to this profile');
  }

  /**
   * Assert the user can mutate this profile (owner or shared with "admin" permission)
   */
  private async assertOwnership(profileId: string, userId: string, _orgId: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true, organizationId: true },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    // Owner — always allowed
    if (profile.userId === userId) return;

    // Check for admin sharing permission
    const permission = await this.sharingService.getPermission('profile', profileId, userId, []);
    if (permission === 'admin') return;

    throw new ForbiddenException('You do not own this profile');
  }

  /**
   * Get all profiles owned by or shared with the user
   */
  async findAll(userId: string, orgId: string) {
    const include = {
      mcpServers: {
        include: { mcpServer: true },
        orderBy: { order: 'asc' as const },
      },
    };

    // Get shared profile IDs (direct user shares only — pass [] for orgIds)
    const sharedIds = await this.sharingService.getSharedResourceIds('profile', userId, []);

    return this.prisma.profile.findMany({
      where: {
        OR: [
          { userId, organizationId: orgId }, // own org profiles
          ...(sharedIds.length > 0 ? [{ id: { in: sharedIds } }] : []), // shared
        ],
      },
      include,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a specific profile by ID
   */
  async findById(id: string, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertAccess(id, userId, orgId);
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        mcpServers: {
          include: {
            mcpServer: true,
            tools: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    return profile;
  }

  /**
   * Get aggregated tool info for a profile by ID.
   */
  async getInfo(id: string, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertAccess(id, userId, orgId);
    }

    return this.proxyService.getProfileInfoById(id);
  }

  /**
   * Get a specific profile by name within the active org for the user
   */
  async findByName(name: string, userId: string, orgId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId_organizationId_name: { userId, organizationId: orgId, name } },
      include: {
        mcpServers: {
          include: { mcpServer: true, tools: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with name "${name}" not found`);
    }

    return profile;
  }

  /**
   * Create a new profile in the active org
   */
  async create(dto: CreateProfileDto, userId: string, orgId: string) {
    // Validate against reserved names
    this.validateProfileName(dto.name);

    // Check for unique name within the user+org
    const existing = await this.prisma.profile.findUnique({
      where: { userId_organizationId_name: { userId, organizationId: orgId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Profile with name "${dto.name}" already exists`);
    }

    return this.prisma.profile.create({
      data: {
        name: dto.name,
        description: dto.description,
        userId,
        organizationId: orgId,
      },
    });
  }

  /**
   * Update a profile
   */
  async update(id: string, dto: UpdateProfileDto, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertOwnership(id, userId, orgId);
    }

    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    // Validate new name against reserved names
    if (dto.name) {
      this.validateProfileName(dto.name);
    }

    // Check for unique name if changing (within the same user+org)
    if (dto.name && dto.name !== profile.name) {
      const existing = await this.prisma.profile.findUnique({
        where: {
          userId_organizationId_name: {
            userId: profile.userId,
            organizationId: profile.organizationId,
            name: dto.name,
          },
        },
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
  async delete(id: string, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertOwnership(id, userId, orgId);
    }

    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }

    await this.prisma.profile.delete({ where: { id } });
  }

  /**
   * Get servers for a profile
   */
  async getServers(profileId: string, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertAccess(profileId, userId, orgId);
    }

    return this.prisma.profileMcpServer.findMany({
      where: { profileId },
      include: {
        mcpServer: true,
        tools: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Add an MCP server to a profile
   */
  async addServer(profileId: string, dto: AddServerToProfileDto, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertOwnership(profileId, userId, orgId);
    }

    // Check profile exists
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Check server exists and user has access to it
    const server = await this.prisma.mcpServer.findUnique({ where: { id: dto.mcpServerId } });
    if (!server) {
      throw new NotFoundException(`MCP server ${dto.mcpServerId} not found`);
    }

    // Verify the user owns or has been shared the server
    if (server.userId !== userId) {
      const sharedIds = orgId
        ? await this.sharingService.getSharedResourceIds('mcp_server', userId, [orgId])
        : [];
      if (!sharedIds.includes(server.id)) {
        throw new ForbiddenException('You do not have access to this MCP server');
      }
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
      include: { mcpServer: true },
    });
  }

  /**
   * Update a server in a profile
   */
  async updateServer(
    profileId: string,
    serverId: string,
    dto: UpdateServerInProfileDto,
    userId: string,
    orgId?: string
  ) {
    if (orgId) {
      await this.assertOwnership(profileId, userId, orgId);
    }

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
      include: { mcpServer: true },
    });
  }

  /**
   * Remove a server from a profile
   */
  async removeServer(profileId: string, serverId: string, userId: string, orgId?: string) {
    if (orgId) {
      await this.assertOwnership(profileId, userId, orgId);
    }

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
  async getServerTools(
    profileId: string,
    serverId: string,
    _refresh = false,
    userId: string,
    orgId?: string
  ) {
    if (orgId) {
      await this.assertAccess(profileId, userId, orgId);
    }

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
      include: { tools: true },
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
  async updateServerTools(
    profileId: string,
    serverId: string,
    tools: UpdateToolDto[],
    userId: string,
    orgId?: string
  ) {
    if (orgId) {
      await this.assertOwnership(profileId, userId, orgId);
    }

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
    return this.getServerTools(profileId, serverId, false, userId, orgId);
  }
}
