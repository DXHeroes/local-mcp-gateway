/**
 * Profiles Controller
 *
 * REST API endpoints for profile management.
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
   * Get all profiles
   */
  @Get()
  async getAll() {
    return this.profilesService.findAll();
  }

  /**
   * Get a specific profile by ID
   */
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  /**
   * Get a profile by name
   */
  @Get('by-name/:name')
  async getByName(@Param('name') name: string) {
    return this.profilesService.findByName(name);
  }

  /**
   * Create a new profile
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProfileDto) {
    return this.profilesService.create(dto);
  }

  /**
   * Update a profile
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(id, dto);
  }

  /**
   * Delete a profile
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.profilesService.delete(id);
  }

  /**
   * Get servers for a profile
   */
  @Get(':id/servers')
  async getServers(@Param('id') id: string) {
    return this.profilesService.getServers(id);
  }

  /**
   * Add a server to a profile
   */
  @Post(':id/servers')
  @HttpCode(HttpStatus.CREATED)
  async addServer(@Param('id') id: string, @Body() dto: AddServerDto) {
    return this.profilesService.addServer(id, dto);
  }

  /**
   * Update a server in a profile
   */
  @Put(':id/servers/:serverId')
  async updateServer(
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: UpdateServerDto
  ) {
    return this.profilesService.updateServer(id, serverId, dto);
  }

  /**
   * Remove a server from a profile
   */
  @Delete(':id/servers/:serverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeServer(@Param('id') id: string, @Param('serverId') serverId: string) {
    await this.profilesService.removeServer(id, serverId);
  }

  /**
   * Toggle server active status in a profile
   */
  @Put(':id/servers/:serverId/toggle')
  async toggleServer(
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: { isActive: boolean }
  ) {
    return this.profilesService.updateServer(id, serverId, { isActive: dto.isActive });
  }

  /**
   * Get tools for a server in a profile
   */
  @Get(':id/servers/:serverId/tools')
  async getServerTools(
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Query('refresh') refresh?: string
  ) {
    return this.profilesService.getServerTools(id, serverId, refresh === 'true');
  }

  /**
   * Update tool customizations for a server in a profile
   */
  @Put(':id/servers/:serverId/tools')
  async updateServerTools(
    @Param('id') id: string,
    @Param('serverId') serverId: string,
    @Body() dto: { tools: UpdateToolDto[] }
  ) {
    return this.profilesService.updateServerTools(id, serverId, dto.tools);
  }
}
