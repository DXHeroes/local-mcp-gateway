/**
 * Sharing Controller
 *
 * REST API endpoints for resource sharing.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
import { SharingService } from './sharing.service.js';

interface CreateShareDto {
  resourceType: 'profile' | 'mcp_server';
  resourceId: string;
  sharedWithType: 'user' | 'organization';
  sharedWithId: string;
  permission?: string;
}

@SkipOrgCheck()
@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async share(@CurrentUser() user: AuthUser, @Body() dto: CreateShareDto) {
    return this.sharingService.share(user.id, dto);
  }

  @Get(':resourceType/:resourceId')
  async listShares(
    @CurrentUser() user: AuthUser,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string
  ) {
    return this.sharingService.listShares(user.id, resourceType, resourceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeShare(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.sharingService.removeShare(user.id, id);
  }
}
