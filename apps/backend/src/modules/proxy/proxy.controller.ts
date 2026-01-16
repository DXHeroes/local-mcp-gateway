/**
 * Proxy Controller
 *
 * MCP proxy endpoints for profiles and gateway.
 * Supports MCP Streamable HTTP transport (2025-11-25 spec) with SSE notifications.
 *
 * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request, Response } from 'express';
import { fromEvent, map } from 'rxjs';
import { GATEWAY_PROFILE_CHANGED, SettingsService } from '../settings/settings.service.js';
import type { McpRequest, McpResponse } from './proxy.service.js';
import { ProxyService } from './proxy.service.js';

@Controller('mcp')
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // =========================================
  // Gateway Endpoints (must come BEFORE :profileName routes)
  // =========================================

  /**
   * SSE endpoint for gateway notifications (dedicated URL)
   * Sends notifications/tools/list_changed when the active profile changes.
   */
  @Get('gateway/sse')
  streamGatewaySse(@Req() req: Request, @Res() res: Response) {
    return this.streamGatewayEvents(req, res);
  }

  /**
   * POST handler for gateway SSE - handles JSON-RPC requests via SSE transport
   */
  @Post('gateway/sse')
  @HttpCode(HttpStatus.OK)
  async handleGatewaySseRequest(@Body() request: McpRequest): Promise<McpResponse> {
    return this.handleGatewayRequest(request);
  }

  /**
   * Get gateway info - proxies to default profile info
   */
  @Get('gateway/info')
  async getGatewayInfo() {
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      const info = await this.proxyService.getProfileInfo(profileName);
      return {
        ...info,
        gateway: {
          activeProfile: profileName,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Default gateway profile "${profileName}" not found. Please select a valid profile in settings.`
        );
      }
      throw error;
    }
  }

  /**
   * GET handler for gateway endpoint
   *
   * Streamable HTTP content negotiation:
   * - Accept: text/event-stream -> Returns SSE stream for notifications
   * - Otherwise -> Returns JSON usage instructions
   *
   * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http
   */
  @Get('gateway')
  async getGatewayEndpoint(@Req() req: Request, @Res() res: Response) {
    // Streamable HTTP: check Accept header for content negotiation
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      return this.streamGatewayEvents(req, res);
    }

    // Return JSON usage info
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      const info = await this.proxyService.getProfileInfo(profileName);
      return res.json({
        message: 'This is the MCP Gateway endpoint. Use POST for JSON-RPC requests.',
        usage: {
          method: 'POST',
          contentType: 'application/json',
          body: {
            jsonrpc: '2.0',
            method: 'tools/list',
            id: 1,
          },
        },
        endpoints: {
          sse: '/api/mcp/gateway/sse',
          http: '/api/mcp/gateway',
        },
        gateway: {
          activeProfile: profileName,
          settingsEndpoint: '/api/settings/default-gateway-profile',
        },
        profile: {
          name: profileName,
          toolCount: info.tools.length,
          serverCount: info.serverStatus.total,
          connectedServers: info.serverStatus.connected,
        },
        infoEndpoint: '/api/mcp/gateway/info',
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Default gateway profile "${profileName}" not found. Please select a valid profile in settings.`
        );
      }
      throw error;
    }
  }

  /**
   * Stream SSE events for gateway notifications.
   * Sends notifications/tools/list_changed when the active profile changes.
   *
   * Follows MCP Streamable HTTP transport (2025-11-25):
   * - No endpoint event needed (unified endpoint)
   * - Simple data: format without event: prefix
   *
   * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http
   */
  private streamGatewayEvents(req: Request, res: Response) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // For nginx

    // Streamable HTTP - no endpoint event needed
    // Just send a comment to establish connection
    res.write(': connected\n\n');

    // Subscribe to profile change events
    const subscription = fromEvent(this.eventEmitter, GATEWAY_PROFILE_CHANGED)
      .pipe(
        map(() => ({
          jsonrpc: '2.0',
          method: 'notifications/tools/list_changed',
        }))
      )
      .subscribe((notification) => {
        // Streamable HTTP - simple data format, no event prefix
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
      });

    // Cleanup on client disconnect
    req.on('close', () => {
      subscription.unsubscribe();
    });
  }

  /**
   * MCP JSON-RPC endpoint for the gateway - proxies to default profile
   */
  @Post('gateway')
  @HttpCode(HttpStatus.OK)
  async handleGatewayRequest(@Body() request: McpRequest): Promise<McpResponse> {
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      return await this.proxyService.handleRequest(profileName, request);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Default gateway profile "${profileName}" not found. Please select a valid profile in settings.`
        );
      }
      throw error;
    }
  }

  // =========================================
  // Profile-specific Endpoints (existing)
  // =========================================

  /**
   * SSE endpoint for profile notifications (dedicated URL)
   * Sends notifications/tools/list_changed when the active gateway profile changes.
   */
  @Get(':profileName/sse')
  async streamProfileSse(
    @Param('profileName') profileName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Validate profile exists
    await this.proxyService.getProfileInfo(profileName);
    return this.streamGatewayEvents(req, res);
  }

  /**
   * POST handler for profile SSE - handles JSON-RPC requests via SSE transport
   */
  @Post(':profileName/sse')
  @HttpCode(HttpStatus.OK)
  async handleProfileSseRequest(
    @Param('profileName') profileName: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    return this.handleMcpRequest(profileName, request);
  }

  /**
   * Get profile info with aggregated tools and server status
   */
  @Get(':profileName/info')
  async getProfileInfo(@Param('profileName') profileName: string) {
    return this.proxyService.getProfileInfo(profileName);
  }

  /**
   * GET handler for MCP endpoint
   *
   * Streamable HTTP content negotiation:
   * - Accept: text/event-stream -> Returns SSE stream for notifications
   * - Otherwise -> Returns JSON usage instructions
   *
   * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http
   */
  @Get(':profileName')
  async getMcpEndpoint(
    @Param('profileName') profileName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Validate profile exists first
    const info = await this.proxyService.getProfileInfo(profileName);

    // Streamable HTTP: check Accept header for content negotiation
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      return this.streamGatewayEvents(req, res);
    }

    // Return JSON usage info
    return res.json({
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
      endpoints: {
        sse: `/api/mcp/${profileName}/sse`,
        http: `/api/mcp/${profileName}`,
      },
      profile: {
        name: profileName,
        toolCount: info.tools.length,
        serverCount: info.serverStatus.total,
        connectedServers: info.serverStatus.connected,
      },
      infoEndpoint: `/api/mcp/${profileName}/info`,
    });
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
