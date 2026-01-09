/**
 * Profiles Module
 *
 * Handles profile management for grouping MCP servers.
 */

import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
