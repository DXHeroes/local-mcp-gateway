/**
 * Proxy Controller
 *
 * MCP proxy endpoints for profiles.
 */

import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ProxyService } from './proxy.service.js';
import type { McpRequest, McpResponse } from './proxy.service.js';

@Controller('mcp')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Get profile info with aggregated tools and server status
   */
  @Get(':profileName/info')
  async getProfileInfo(@Param('profileName') profileName: string) {
    return this.proxyService.getProfileInfo(profileName);
  }

  /**
   * MCP JSON-RPC endpoint for a profile
   */
  @Post(':profileName')
  @HttpCode(HttpStatus.OK)
  async handleMcpRequest(
    @Param('profileName') profileName: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    return this.proxyService.handleRequest(profileName, request);
  }
}
