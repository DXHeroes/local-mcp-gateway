/**
 * MCP Controller
 *
 * REST API endpoints for MCP server management.
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
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service.js';
import { ActiveOrgId } from '../auth/decorators/active-org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';
import { MCP_PRESETS } from './mcp-presets.js';
import { McpService } from './mcp.service.js';
import { McpRegistry } from './mcp-registry.js';

@Controller('mcp-servers')
export class McpController {
  constructor(
    private readonly mcpService: McpService,
    private readonly registry: McpRegistry
  ) {}

  /**
   * Get all available MCP packages (discovered)
   */
  @Get('available')
  getAvailablePackages() {
    return this.registry.getAllMetadata();
  }

  /**
   * Get all available MCP presets (gallery)
   */
  @Get('presets')
  @SkipOrgCheck()
  getPresets() {
    return MCP_PRESETS;
  }

  /**
   * Add a preset to the user's active organization
   */
  @Post('presets/:presetId/add')
  @HttpCode(HttpStatus.CREATED)
  async addPreset(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('presetId') presetId: string
  ) {
    return this.mcpService.addPreset(presetId, user.id, orgId);
  }

  /**
   * Get all configured MCP servers visible to user in the active org
   */
  @Get()
  async getAll(@CurrentUser() user: AuthUser, @ActiveOrgId() orgId: string) {
    return this.mcpService.findAll(user.id, orgId);
  }

  /**
   * Get a specific MCP server
   */
  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.mcpService.findById(id, user.id, orgId);
  }

  /**
   * Create a new MCP server configuration
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Body() dto: CreateMcpServerDto
  ) {
    return this.mcpService.create(dto, user.id, orgId);
  }

  /**
   * Update an MCP server configuration
   */
  @Put(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMcpServerDto
  ) {
    return this.mcpService.update(id, dto, user.id, orgId);
  }

  /**
   * Delete an MCP server configuration
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    await this.mcpService.delete(id, user.id, orgId);
  }

  /**
   * Get tools from an MCP server
   */
  @Get(':id/tools')
  async getTools(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.mcpService.getTools(id, user.id, orgId);
  }

  /**
   * Get MCP server status
   */
  @Get(':id/status')
  async getStatus(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.mcpService.getStatus(id, user.id, orgId);
  }

}
