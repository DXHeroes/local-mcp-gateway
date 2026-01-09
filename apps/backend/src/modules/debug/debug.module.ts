/**
 * Debug Module
 *
 * Debug logging endpoints for MCP traffic inspection.
 */

import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller.js';
import { DebugService } from './debug.service.js';

@Module({
  controllers: [DebugController],
  providers: [DebugService],
  exports: [DebugService],
})
export class DebugModule {}
