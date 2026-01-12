/**
 * Debug Controller
 *
 * REST API endpoints for debug log management.
 */

import { Controller, Delete, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { DebugService } from './debug.service.js';

@Controller('debug')
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  /**
   * Get debug logs with optional filters
   */
  @Get('logs')
  async getLogs(
    @Query('profileId') profileId?: string,
    @Query('mcpServerId') mcpServerId?: string,
    @Query('status') status?: 'pending' | 'success' | 'error',
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const filter = {
      profileId,
      mcpServerId,
      status,
      since: since ? new Date(since) : undefined,
      until: until ? new Date(until) : undefined,
    };

    return this.debugService.getLogs(
      filter,
      limit ? Number.parseInt(limit, 10) : 100,
      offset ? Number.parseInt(offset, 10) : 0
    );
  }

  /**
   * Clear debug logs
   */
  @Delete('logs')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearLogs(
    @Query('profileId') profileId?: string,
    @Query('mcpServerId') mcpServerId?: string
  ) {
    await this.debugService.clearLogs({ profileId, mcpServerId });
  }
}
