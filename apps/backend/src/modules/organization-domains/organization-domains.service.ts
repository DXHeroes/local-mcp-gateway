/**
 * Organization Domains Service
 *
 * Manages email domains for automatic organization membership on signup.
 */

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BLACKLISTED_DOMAINS } from './blacklisted-domains.js';

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

@Injectable()
export class OrganizationDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDomains(organizationId: string) {
    return this.prisma.organizationDomain.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDomain(organizationId: string, userId: string, rawDomain: string) {
    await this.assertAdminOrOwner(organizationId, userId);

    const domain = rawDomain.replace(/^@/, '').toLowerCase().trim();

    if (!DOMAIN_REGEX.test(domain)) {
      throw new BadRequestException('Invalid domain format');
    }

    if (BLACKLISTED_DOMAINS.has(domain)) {
      throw new BadRequestException(
        'Public email provider domains (e.g. gmail.com) cannot be used for auto-join'
      );
    }

    return this.prisma.organizationDomain.create({
      data: { organizationId, domain },
    });
  }

  async removeDomain(organizationId: string, userId: string, domainId: string) {
    await this.assertAdminOrOwner(organizationId, userId);

    await this.prisma.organizationDomain.deleteMany({
      where: { id: domainId, organizationId },
    });
  }

  private async assertAdminOrOwner(organizationId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { organizationId, userId, role: { in: ['owner', 'admin'] } },
    });
    if (!member) {
      throw new ForbiddenException('Only admins/owners can manage domains');
    }
  }
}
