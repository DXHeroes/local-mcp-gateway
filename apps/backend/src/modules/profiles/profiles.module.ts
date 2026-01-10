/**
 * Profiles Module
 *
 * Handles profile management for grouping MCP servers.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';
import { ProxyModule } from '../proxy/proxy.module.js';

@Module({
  imports: [forwardRef(() => ProxyModule)],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
