/**
 * Profiles Controller
 *
 * REST API endpoints for profile management.
 * All routes scoped to the authenticated user's active organization.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service.js';
import { ActiveOrgId } from '../auth/decorators/active-org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ProfilesService } from './profiles.service.js';

interface CreateProfileDto {
  name: string;
  description?: string | null;
}

interface UpdateProfileDto {
  name?: string;
  description?: string | null;
}

interface AddServerDto {
  mcpServerId: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateServerDto {
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

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Get all profiles visible to user in the active org
   */
  @Get()
  async getAll(@CurrentUser() user: AuthUser, @ActiveOrgId() orgId: string) {
    return this.profilesService.findAll(user.id, orgId);
  }

  /**
   * Get aggregated info for a specific profile by ID
   */
  @Get(':id/info')
  async getInfo(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.profilesService.getInfo(id, user.id, orgId);
  }

  /**
   * Get a specific profile by ID
   */
  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.profilesService.findById(id, user.id, orgId);
  }

  /**
   * Get a profile by name
   */
  @Get('by-name/:name')
  async getByName(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('name') name: string
  ) {
    return this.profilesService.findByName(name, user.id, orgId);
  }

  /**
   * Create a new profile
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Body() dto: CreateProfileDto
  ) {
    return this.profilesService.create(dto, user.id, orgId);
  }

  /**
   * Update a profile
   */
  @Put(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.profilesService.update(id, dto, user.id, orgId);
  }

  /**
   * Delete a profile
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    await this.profilesService.delete(id, user.id, orgId);
  }

  /**
   * Get servers for a profile
   */
  @Get(':id/servers')
  async getServers(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.profilesService.getServers(id, user.id, orgId);
  }

  /**
   * Add a server to a profile
   */
  @Post(':id/servers')
  @HttpCode(HttpStatus.CREATED)
  async addServer(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: AddServerDto
  ) {
    return this.profilesService.addServer(id, dto, user.id, orgId);
  }

  /**
   * Update a server in a profile
   */
  @Put(':id/servers/:serverId')
  async updateServer(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: UpdateServerDto
  ) {
    return this.profilesService.updateServer(id, serverId, dto, user.id, orgId);
  }

  /**
   * Remove a server from a profile
   */
  @Delete(':id/servers/:serverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeServer(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Param('serverId') serverId: string
  ) {
    await this.profilesService.removeServer(id, serverId, user.id, orgId);
  }

  /**
   * Toggle server active status in a profile
   */
  @Put(':id/servers/:serverId/toggle')
  async toggleServer(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: { isActive: boolean }
  ) {
    return this.profilesService.updateServer(
      id,
      serverId,
      { isActive: dto.isActive },
      user.id,
      orgId
    );
  }

  /**
   * Get tools for a server in a profile
   */
  @Get(':id/servers/:serverId/tools')
  async getServerTools(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Query('refresh') refresh?: string
  ) {
    return this.profilesService.getServerTools(id, serverId, refresh === 'true', user.id, orgId);
  }

  /**
   * Update tool customizations for a server in a profile
   */
  @Put(':id/servers/:serverId/tools')
  async updateServerTools(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: { tools: UpdateToolDto[] }
  ) {
    return this.profilesService.updateServerTools(id, serverId, dto.tools, user.id, orgId);
  }
}
