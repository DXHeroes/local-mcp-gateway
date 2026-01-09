/**
 * Health Controller
 *
 * Health check endpoints for monitoring and load balancers.
 */

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basic liveness probe
   */
  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe with database check
   */
  @Get('ready')
  async getReadiness() {
    try {
      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
