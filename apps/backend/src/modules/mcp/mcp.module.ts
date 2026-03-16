/**
 * MCP Module
 *
 * Handles MCP server management, discovery, and registry.
 * Builtin packages are registered in-memory; users add them via presets.
 */

import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { DebugModule } from '../debug/debug.module.js';
import { SharingModule } from '../sharing/sharing.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';
import { McpDiscoveryService } from './mcp-discovery.service.js';
import { McpRegistry } from './mcp-registry.js';

@Module({
  imports: [DebugModule, SharingModule],
  controllers: [McpController],
  providers: [McpService, McpDiscoveryService, McpRegistry],
  exports: [McpService, McpRegistry],
})
export class McpModule implements OnModuleInit {
  private readonly logger = new Logger(McpModule.name);

  constructor(
    private readonly discoveryService: McpDiscoveryService,
    private readonly registry: McpRegistry
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing MCP Module...');

    // 1. Discover all MCP packages
    const packages = await this.discoveryService.discoverPackages();
    this.logger.log(`Discovered ${packages.length} MCP packages`);

    // 2. Register them in the in-memory registry (for proxy use + presets gallery)
    for (const pkg of packages) {
      this.registry.register(pkg);
      this.logger.log(`Registered: ${pkg.package.metadata.name} (${pkg.package.metadata.id})`);
    }

    // No auto-seeding — users add builtins from the presets gallery
    this.logger.log('MCP Module initialization complete');
  }
}
