/**
 * Profiles Module
 *
 * Handles profile management for grouping MCP servers.
 */

import { forwardRef, Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [forwardRef(() => ProxyModule)],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
