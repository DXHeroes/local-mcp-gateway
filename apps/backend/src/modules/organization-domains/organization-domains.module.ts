/**
 * Organization Domains Module
 *
 * Handles email domain management for automatic organization membership.
 */

import { Module } from '@nestjs/common';
import { OrganizationDomainsController } from './organization-domains.controller.js';
import { OrganizationDomainsService } from './organization-domains.service.js';

@Module({
  controllers: [OrganizationDomainsController],
  providers: [OrganizationDomainsService],
})
export class OrganizationDomainsModule {}
