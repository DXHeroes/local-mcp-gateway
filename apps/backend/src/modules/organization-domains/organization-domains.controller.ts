/**
 * Organization Domains Controller
 *
 * REST API endpoints for managing auto-join email domains.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service.js';
import { ActiveOrgId } from '../auth/decorators/active-org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { OrganizationDomainsService } from './organization-domains.service.js';

@Controller('organization-domains')
export class OrganizationDomainsController {
  constructor(private readonly domainsService: OrganizationDomainsService) {}

  @Get()
  async listDomains(@ActiveOrgId() orgId: string) {
    return this.domainsService.listDomains(orgId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addDomain(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Body() body: { domain: string }
  ) {
    return this.domainsService.addDomain(orgId, user.id, body.domain);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDomain(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    await this.domainsService.removeDomain(orgId, user.id, id);
  }
}
