/**
 * Debug Controller
 *
 * REST API endpoints for debug log management.
 */

import { Controller, Delete, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
import { DebugService } from './debug.service.js';

@SkipOrgCheck()
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
    @Query('requestType') requestType?: string,
    @Query('status') status?: 'pending' | 'success' | 'error',
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.debugService.getLogs({
      profileId,
      mcpServerId,
      requestType,
      status,
      since,
      until,
      page,
      limit,
      offset,
    });
  }

  @Get('logs/summary')
  async getSummary(
    @Query('profileId') profileId?: string,
    @Query('mcpServerId') mcpServerId?: string,
    @Query('requestType') requestType?: string,
    @Query('status') status?: 'pending' | 'success' | 'error',
    @Query('since') since?: string,
    @Query('until') until?: string
  ) {
    return this.debugService.getSummary({
      profileId,
      mcpServerId,
      requestType,
      status,
      since,
      until,
    });
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
