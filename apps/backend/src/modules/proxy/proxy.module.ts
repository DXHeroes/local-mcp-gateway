/**
 * Proxy Module
 *
 * Handles MCP proxy endpoints for profiles.
 */

import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller.js';
import { ProxyService } from './proxy.service.js';
import { McpModule } from '../mcp/mcp.module.js';
import { DebugModule } from '../debug/debug.module.js';

@Module({
  imports: [McpModule, DebugModule],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
