/**
 * Sharing Service
 *
 * Manages resource sharing between users and organizations.
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface CreateShareDto {
  resourceType: 'profile' | 'mcp_server';
  resourceId: string;
  sharedWithType: 'user' | 'organization';
  sharedWithId: string;
  permission?: string;
}

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Share a resource with a user or organization
   */
  async share(userId: string, dto: CreateShareDto) {
    // Verify the user owns the resource
    await this.verifyOwnership(userId, dto.resourceType, dto.resourceId);

    // Check for existing share
    const existing = await this.prisma.sharedResource.findUnique({
      where: {
        resourceType_resourceId_sharedWithType_sharedWithId: {
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
          sharedWithType: dto.sharedWithType,
          sharedWithId: dto.sharedWithId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Resource is already shared with this target');
    }

    return this.prisma.sharedResource.create({
      data: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        sharedWithType: dto.sharedWithType,
        sharedWithId: dto.sharedWithId,
        permission: dto.permission || 'use',
        sharedByUserId: userId,
      },
    });
  }

  /**
   * List shares for a resource
   */
  async listShares(userId: string, resourceType: string, resourceId: string) {
    // Verify the user owns the resource
    await this.verifyOwnership(userId, resourceType, resourceId);

    return this.prisma.sharedResource.findMany({
      where: {
        resourceType,
        resourceId,
      },
    });
  }

  /**
   * Remove a share
   */
  async removeShare(userId: string, shareId: string) {
    const share = await this.prisma.sharedResource.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Only the sharer can remove the share
    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('Only the owner can remove this share');
    }

    await this.prisma.sharedResource.delete({ where: { id: shareId } });
  }

  /**
   * Check if a resource is shared with a user (directly or via org)
   */
  async isSharedWith(
    resourceType: string,
    resourceId: string,
    userId: string,
    organizationIds: string[]
  ): Promise<boolean> {
    const count = await this.prisma.sharedResource.count({
      where: {
        resourceType,
        resourceId,
        OR: [
          { sharedWithType: 'user', sharedWithId: userId },
          ...(organizationIds.length > 0
            ? [
                {
                  sharedWithType: 'organization',
                  sharedWithId: { in: organizationIds },
                },
              ]
            : []),
        ],
      },
    });
    return count > 0;
  }

  /**
   * Get IDs of resources shared with a user (directly or via orgs)
   */
  async getSharedResourceIds(
    resourceType: string,
    userId: string,
    organizationIds: string[]
  ): Promise<string[]> {
    const shares = await this.prisma.sharedResource.findMany({
      where: {
        resourceType,
        OR: [
          { sharedWithType: 'user', sharedWithId: userId },
          ...(organizationIds.length > 0
            ? [
                {
                  sharedWithType: 'organization',
                  sharedWithId: { in: organizationIds },
                },
              ]
            : []),
        ],
      },
      select: { resourceId: true },
    });
    return shares.map((s) => s.resourceId);
  }

  private async verifyOwnership(userId: string, resourceType: string, resourceId: string) {
    if (resourceType === 'profile') {
      const profile = await this.prisma.profile.findUnique({
        where: { id: resourceId },
      });
      if (!profile) throw new NotFoundException('Profile not found');
      if (profile.userId && profile.userId !== userId) {
        throw new ForbiddenException('You do not own this profile');
      }
    } else if (resourceType === 'mcp_server') {
      const server = await this.prisma.mcpServer.findUnique({
        where: { id: resourceId },
      });
      if (!server) throw new NotFoundException('MCP server not found');
      if (server.userId && server.userId !== userId) {
        throw new ForbiddenException('You do not own this MCP server');
      }
    }
  }
}
