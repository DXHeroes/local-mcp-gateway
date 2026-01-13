/**
 * Proxy Controller
 *
 * MCP proxy endpoints for profiles.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { McpRequest, McpResponse } from './proxy.service.js';
import { ProxyService } from './proxy.service.js';

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
   * GET handler for MCP endpoint - returns usage instructions instead of 404
   */
  @Get(':profileName')
  async getMcpEndpoint(@Param('profileName') profileName: string) {
    const info = await this.proxyService.getProfileInfo(profileName);
    return {
      message: 'This is an MCP (Model Context Protocol) endpoint. Use POST for JSON-RPC requests.',
      usage: {
        method: 'POST',
        contentType: 'application/json',
        body: {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        },
      },
      profile: {
        name: profileName,
        toolCount: info.tools.length,
        serverCount: info.serverStatus.total,
        connectedServers: info.serverStatus.connected,
      },
      infoEndpoint: `/api/mcp/${profileName}/info`,
    };
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
