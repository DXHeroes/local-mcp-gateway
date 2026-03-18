/**
 * Proxy Controller
 *
 * MCP proxy endpoints for profiles and gateway.
 * Supports MCP Streamable HTTP transport (2025-11-25 spec) with SSE notifications.
 * Profile endpoints use org slug: /api/mcp/:orgSlug/:profileName
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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request, Response } from 'express';
import { fromEvent, map } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator.js';
import { McpOAuthGuard } from '../auth/mcp-oauth.guard.js';
import { GATEWAY_PROFILE_CHANGED, SettingsService } from '../settings/settings.service.js';
import type { McpRequest, McpResponse } from './proxy.service.js';
import { ProxyService } from './proxy.service.js';

@Public()
@UseGuards(McpOAuthGuard)
@Controller('mcp')
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Resolve user from request.
   * McpOAuthGuard always validates and attaches user before this is called.
   */
  private resolveUser(req: Request): { id: string } {
    if (!req.user) {
      throw new UnauthorizedException('Authenticated MCP user not found on request');
    }

    return req.user;
  }

  // =========================================
  // Gateway Endpoints (must come BEFORE parameterized routes)
  // =========================================

  /**
   * SSE endpoint for gateway notifications (dedicated URL)
   */
  @Get('gateway/sse')
  streamGatewaySse(@Req() req: Request, @Res() res: Response) {
    return this.streamGatewayEvents(req, res);
  }

  /**
   * POST handler for gateway SSE
   */
  @Post('gateway/sse')
  @HttpCode(HttpStatus.OK)
  async handleGatewaySseRequest(
    @Req() req: Request,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    return this.handleGatewayRequest(req, request);
  }

  /**
   * Get gateway info
   */
  @Get('gateway/info')
  async getGatewayInfo(@Req() req: Request) {
    const user = this.resolveUser(req);
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      const info = await this.proxyService.getProfileInfo(profileName, user.id);
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
   */
  @Get('gateway')
  async getGatewayEndpoint(@Req() req: Request, @Res() res: Response) {
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      return this.streamGatewayEvents(req, res);
    }

    const user = this.resolveUser(req);
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      const info = await this.proxyService.getProfileInfo(profileName, user.id);
      return res.json({
        message: 'This is the MCP Gateway endpoint. Use POST for JSON-RPC requests.',
        usage: {
          method: 'POST',
          contentType: 'application/json',
          body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
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
   * Stream SSE events for notifications.
   */
  private streamGatewayEvents(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(': connected\n\n');

    const subscription = fromEvent(this.eventEmitter, GATEWAY_PROFILE_CHANGED)
      .pipe(
        map(() => ({
          jsonrpc: '2.0',
          method: 'notifications/tools/list_changed',
        }))
      )
      .subscribe((notification) => {
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
      });

    req.on('close', () => {
      subscription.unsubscribe();
    });
  }

  /**
   * MCP JSON-RPC endpoint for the gateway
   */
  @Post('gateway')
  @HttpCode(HttpStatus.OK)
  async handleGatewayRequest(
    @Req() req: Request,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    const user = this.resolveUser(req);
    const profileName = await this.settingsService.getDefaultGatewayProfile();

    try {
      return await this.proxyService.handleRequest(profileName, request, user.id);
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
  // Org-scoped Gateway Endpoints: /api/mcp/:orgSlug/gateway
  // (must come BEFORE :orgSlug/:profileName to avoid "gateway" matching :profileName)
  // =========================================

  /**
   * SSE endpoint for org-scoped gateway
   */
  @Get(':orgSlug/gateway/sse')
  async streamOrgGatewaySse(
    @Param('orgSlug') orgSlug: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    const user = this.resolveUser(req);
    await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);
    return this.streamGatewayEvents(req, res);
  }

  /**
   * POST handler for org-scoped gateway SSE
   */
  @Post(':orgSlug/gateway/sse')
  @HttpCode(HttpStatus.OK)
  async handleOrgGatewaySseRequest(
    @Req() req: Request,
    @Param('orgSlug') orgSlug: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    const user = this.resolveUser(req);
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    return this.proxyService.handleRequestByOrgSlug(profileName, orgSlug, request, user.id);
  }

  /**
   * Get org-scoped gateway info
   */
  @Get(':orgSlug/gateway/info')
  async getOrgGatewayInfo(@Param('orgSlug') orgSlug: string, @Req() req: Request) {
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    const user = this.resolveUser(req);
    const info = await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);
    return {
      ...info,
      gateway: {
        activeProfile: profileName,
      },
    };
  }

  /**
   * GET handler for org-scoped gateway endpoint
   */
  @Get(':orgSlug/gateway')
  async getOrgGatewayEndpoint(
    @Param('orgSlug') orgSlug: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const user = this.resolveUser(req);
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      const profileName = await this.settingsService.getDefaultGatewayProfile();
      await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);
      return this.streamGatewayEvents(req, res);
    }

    const profileName = await this.settingsService.getDefaultGatewayProfile();
    const info = await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);

    return res.json({
      message: 'This is the MCP Gateway endpoint. Use POST for JSON-RPC requests.',
      usage: {
        method: 'POST',
        contentType: 'application/json',
        body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
      },
      endpoints: {
        sse: `/api/mcp/${orgSlug}/gateway/sse`,
        http: `/api/mcp/${orgSlug}/gateway`,
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
      infoEndpoint: `/api/mcp/${orgSlug}/gateway/info`,
    });
  }

  /**
   * MCP JSON-RPC endpoint for org-scoped gateway
   */
  @Post(':orgSlug/gateway')
  @HttpCode(HttpStatus.OK)
  async handleOrgGatewayRequest(
    @Req() req: Request,
    @Param('orgSlug') orgSlug: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    const user = this.resolveUser(req);
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    return this.proxyService.handleRequestByOrgSlug(profileName, orgSlug, request, user.id);
  }

  // =========================================
  // Org-scoped Profile Endpoints: /api/mcp/:orgSlug/:profileName
  // =========================================

  /**
   * SSE endpoint for org-scoped profile
   */
  @Get(':orgSlug/:profileName/sse')
  async streamOrgProfileSse(
    @Param('orgSlug') orgSlug: string,
    @Param('profileName') profileName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const user = this.resolveUser(req);
    await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);
    return this.streamGatewayEvents(req, res);
  }

  /**
   * POST handler for org-scoped profile SSE
   */
  @Post(':orgSlug/:profileName/sse')
  @HttpCode(HttpStatus.OK)
  async handleOrgProfileSseRequest(
    @Req() req: Request,
    @Param('orgSlug') orgSlug: string,
    @Param('profileName') profileName: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    return this.handleOrgMcpRequest(req, orgSlug, profileName, request);
  }

  /**
   * Get org-scoped profile info
   */
  @Get(':orgSlug/:profileName/info')
  async getOrgProfileInfo(
    @Param('orgSlug') orgSlug: string,
    @Param('profileName') profileName: string,
    @Req() req: Request
  ) {
    const user = this.resolveUser(req);
    return this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);
  }

  /**
   * GET handler for org-scoped MCP endpoint
   */
  @Get(':orgSlug/:profileName')
  async getOrgMcpEndpoint(
    @Param('orgSlug') orgSlug: string,
    @Param('profileName') profileName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const user = this.resolveUser(req);
    const info = await this.proxyService.getProfileInfoByOrgSlug(profileName, orgSlug, user.id);

    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/event-stream')) {
      return this.streamGatewayEvents(req, res);
    }

    return res.json({
      message: 'This is an MCP (Model Context Protocol) endpoint. Use POST for JSON-RPC requests.',
      usage: {
        method: 'POST',
        contentType: 'application/json',
        body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
      },
      endpoints: {
        sse: `/api/mcp/${orgSlug}/${profileName}/sse`,
        http: `/api/mcp/${orgSlug}/${profileName}`,
      },
      profile: {
        name: profileName,
        toolCount: info.tools.length,
        serverCount: info.serverStatus.total,
        connectedServers: info.serverStatus.connected,
      },
      infoEndpoint: `/api/mcp/${orgSlug}/${profileName}/info`,
    });
  }

  /**
   * MCP JSON-RPC endpoint for an org-scoped profile
   */
  @Post(':orgSlug/:profileName')
  @HttpCode(HttpStatus.OK)
  async handleOrgMcpRequest(
    @Req() req: Request,
    @Param('orgSlug') orgSlug: string,
    @Param('profileName') profileName: string,
    @Body() request: McpRequest
  ): Promise<McpResponse> {
    const user = this.resolveUser(req);
    return this.proxyService.handleRequestByOrgSlug(profileName, orgSlug, request, user.id);
  }
}
