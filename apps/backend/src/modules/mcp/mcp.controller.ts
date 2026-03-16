/**
 * MCP Controller
 *
 * REST API endpoints for MCP server management.
 * All routes scoped to the authenticated user (per-user ownership).
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth.service.js';
import { ActiveOrgId } from '../auth/decorators/active-org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';
import { McpService } from './mcp.service.js';

@Controller('mcp-servers')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  /**
   * Get unified presets (external + builtin packages)
   */
  @Get('presets')
  @SkipOrgCheck()
  getPresets() {
    return this.mcpService.getUnifiedPresets();
  }

  /**
   * Add a preset to the user's servers
   */
  @Post('presets/:presetId/add')
  @HttpCode(HttpStatus.CREATED)
  async addPreset(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string | null,
    @Param('presetId') presetId: string,
    @Body() body: {
      name?: string;
      apiKeyConfig?: { apiKey: string; headerName?: string; headerValueTemplate?: string };
    }
  ) {
    return this.mcpService.addPreset(presetId, user.id, orgId ?? undefined, body);
  }

  /**
   * Get all configured MCP servers visible to user in the active org
   */
  @Get()
  @Header('Cache-Control', 'private, max-age=5')
  async getAll(@CurrentUser() user: AuthUser, @ActiveOrgId() orgId: string) {
    return this.mcpService.findAll(user.id, orgId);
  }

  /**
   * Get batch status for all MCP servers (parallel)
   */
  @Get('batch-status')
  @Header('Cache-Control', 'private, max-age=60')
  async getBatchStatus(@CurrentUser() user: AuthUser, @ActiveOrgId() orgId: string) {
    return this.mcpService.getBatchStatus(user.id, orgId);
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
   * Get server-level tool configurations (allowlist)
   */
  @Get(':id/tool-configs')
  async getToolConfigs(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string
  ) {
    return this.mcpService.getServerToolConfigs(id, user.id, orgId);
  }

  /**
   * Update server-level tool configurations (allowlist)
   */
  @Put(':id/tool-configs')
  async updateToolConfigs(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: { tools: Array<{ toolName: string; isEnabled: boolean }> }
  ) {
    return this.mcpService.updateServerToolConfigs(id, dto.tools, user.id, orgId);
  }

  /**
   * Get MCP server status
   */
  @Get(':id/status')
  async getStatus(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.mcpService.getStatus(id, user.id, orgId);
    res.setHeader(
      'Cache-Control',
      result.status === 'connected' ? 'private, max-age=60' : 'no-store'
    );
    return result;
  }
}
