/**
 * Sharing Module
 *
 * Handles resource sharing between users and organizations.
 */

import { Module } from '@nestjs/common';
import { SharingController } from './sharing.controller.js';
import { SharingService } from './sharing.service.js';

@Module({
  controllers: [SharingController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}
