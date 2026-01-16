/**
 * Proxy Module
 *
 * Handles MCP proxy endpoints for profiles.
 * Supports SSE notifications for MCP Streamable HTTP transport.
 */

import { Module } from '@nestjs/common';
import { DebugModule } from '../debug/debug.module.js';
import { McpModule } from '../mcp/mcp.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ProxyController } from './proxy.controller.js';
import { ProxyService } from './proxy.service.js';

@Module({
  imports: [McpModule, DebugModule, SettingsModule],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
