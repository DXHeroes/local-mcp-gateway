/**
 * MCP Module
 *
 * Handles MCP server management, discovery, seeding, and registry.
 */

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';
import { McpDiscoveryService } from './mcp-discovery.service.js';
import { McpSeedService } from './mcp-seed.service.js';
import { McpRegistry } from './mcp-registry.js';
import { DebugModule } from '../debug/debug.module.js';

@Module({
  imports: [DebugModule],
  controllers: [McpController],
  providers: [McpService, McpDiscoveryService, McpSeedService, McpRegistry],
  exports: [McpService, McpRegistry],
})
export class McpModule implements OnModuleInit {
  private readonly logger = new Logger(McpModule.name);

  constructor(
    private readonly discoveryService: McpDiscoveryService,
    private readonly seedService: McpSeedService,
    private readonly registry: McpRegistry
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing MCP Module...');

    // 1. Discover all MCP packages
    const packages = await this.discoveryService.discoverPackages();
    this.logger.log(`Discovered ${packages.length} MCP packages`);

    // 2. Register them in the in-memory registry
    for (const pkg of packages) {
      this.registry.register(pkg);
      this.logger.log(`Registered: ${pkg.package.metadata.name} (${pkg.package.metadata.id})`);
    }

    // 3. Run seed data for all packages
    await this.seedService.runSeeds(packages);

    this.logger.log('MCP Module initialization complete');
  }
}
