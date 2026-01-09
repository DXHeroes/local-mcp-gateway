/**
 * MCP Controller
 *
 * REST API endpoints for MCP server management.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { McpService } from './mcp.service.js';
import { McpRegistry } from './mcp-registry.js';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';

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
    const metadata = this.registry.getAllMetadata();
    console.log('[McpController] getAllMetadata result:', metadata);
    console.log('[McpController] registry has packages:', this.registry.getAll().length);
    return metadata;
  }

  /**
   * Get all configured MCP servers
   */
  @Get()
  async getAll() {
    return this.mcpService.findAll();
  }

  /**
   * Get a specific MCP server
   */
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.mcpService.findById(id);
  }

  /**
   * Create a new MCP server configuration
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMcpServerDto) {
    return this.mcpService.create(dto);
  }

  /**
   * Update an MCP server configuration
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMcpServerDto) {
    return this.mcpService.update(id, dto);
  }

  /**
   * Delete an MCP server configuration
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.mcpService.delete(id);
  }

  /**
   * Get tools from an MCP server
   */
  @Get(':id/tools')
  async getTools(@Param('id') id: string) {
    return this.mcpService.getTools(id);
  }

  /**
   * Get MCP server status
   */
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.mcpService.getStatus(id);
  }
}
