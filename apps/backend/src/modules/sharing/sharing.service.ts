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

export interface ShareInboundInfo {
  permission: string;
  sharedByUserName: string;
  sharedByUserEmail: string;
}

export interface ShareOutboundSummary {
  total: number;
  byPermission: Record<string, number>;
}

export interface ResourceSharingSummary {
  inbound?: ShareInboundInfo;
  outbound?: ShareOutboundSummary;
}

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Share a resource with a user or organization
   */
  async share(userId: string, dto: CreateShareDto) {
    // Verify the user owns the resource
    const orgId = await this.verifyOwnership(userId, dto.resourceType, dto.resourceId);

    // Validate share targets are org members
    if (dto.sharedWithType === 'user') {
      if (orgId) {
        const member = await this.prisma.member.findFirst({
          where: { organizationId: orgId, userId: dto.sharedWithId },
        });
        if (!member) {
          throw new ForbiddenException('User is not a member of this organization');
        }
      }
    } else if (dto.sharedWithType === 'organization') {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.sharedWithId },
      });
      if (!org) {
        throw new NotFoundException('Organization not found');
      }
    }

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
   * List shares for a resource, enriched with resolved names
   */
  async listShares(userId: string, resourceType: string, resourceId: string) {
    // Verify the user owns the resource
    await this.verifyOwnership(userId, resourceType, resourceId);

    const shares = await this.prisma.sharedResource.findMany({
      where: {
        resourceType,
        resourceId,
      },
      include: {
        sharedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Enrich with resolved names for share targets
    const enriched = await Promise.all(
      shares.map(async (share) => {
        if (share.sharedWithType === 'user') {
          const user = await this.prisma.user.findUnique({
            where: { id: share.sharedWithId },
            select: { name: true, email: true },
          });
          return { ...share, sharedWithUser: user ?? undefined };
        } else if (share.sharedWithType === 'organization') {
          const org = await this.prisma.organization.findUnique({
            where: { id: share.sharedWithId },
            select: { name: true },
          });
          return { ...share, sharedWithOrganization: org ?? undefined };
        }
        return share;
      })
    );

    return enriched;
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

  /**
   * Get sharing summary for resources of a given type
   */
  async getSharingSummary(
    userId: string,
    organizationIds: string[],
    resourceType: 'profile' | 'mcp_server'
  ): Promise<Record<string, ResourceSharingSummary>> {
    const shares = await this.prisma.sharedResource.findMany({
      where: {
        resourceType,
        OR: [
          { sharedByUserId: userId },
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
      include: {
        sharedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const result: Record<string, ResourceSharingSummary> = {};

    for (const share of shares) {
      if (!result[share.resourceId]) {
        result[share.resourceId] = {};
      }

      const summary = result[share.resourceId];

      if (share.sharedByUserId === userId) {
        // Outbound share
        if (!summary.outbound) {
          summary.outbound = { total: 0, byPermission: {} };
        }
        summary.outbound.total++;
        summary.outbound.byPermission[share.permission] =
          (summary.outbound.byPermission[share.permission] || 0) + 1;
      }

      if (
        share.sharedWithId === userId ||
        organizationIds.includes(share.sharedWithId)
      ) {
        // Inbound share
        summary.inbound = {
          permission: share.permission,
          sharedByUserName: share.sharedBy.name ?? '',
          sharedByUserEmail: share.sharedBy.email ?? '',
        };
      }
    }

    return result;
  }

  private async verifyOwnership(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<string | null> {
    if (resourceType === 'profile') {
      const profile = await this.prisma.profile.findUnique({
        where: { id: resourceId },
      });
      if (!profile) throw new NotFoundException('Profile not found');
      if (profile.userId && profile.userId !== userId) {
        throw new ForbiddenException('You do not own this profile');
      }
      return profile.organizationId;
    } else if (resourceType === 'mcp_server') {
      const server = await this.prisma.mcpServer.findUnique({
        where: { id: resourceId },
      });
      if (!server) throw new NotFoundException('MCP server not found');
      if (server.userId && server.userId !== userId) {
        throw new ForbiddenException('You do not own this MCP server');
      }
      return server.organizationId;
    }
    return null;
  }
}
