/**
 * Settings Controller
 *
 * REST API endpoints for gateway settings management.
 */

import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { AuthUser } from '../auth/auth.service.js';
import { ActiveOrgId } from '../auth/decorators/active-org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
import { SettingsService } from './settings.service.js';

export class UpdateDefaultGatewayProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Profile name cannot be empty' })
  @MaxLength(100, { message: 'Profile name must be at most 100 characters' })
  profileName: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get all gateway settings
   */
  @SkipOrgCheck()
  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  /**
   * Get the default gateway profile setting
   */
  @SkipOrgCheck()
  @Get('default-gateway-profile')
  async getDefaultGatewayProfile() {
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    return { profileName };
  }

  /**
   * Set the default gateway profile
   */
  @Put('default-gateway-profile')
  async setDefaultGatewayProfile(
    @CurrentUser() user: AuthUser,
    @ActiveOrgId() orgId: string,
    @Body() dto: UpdateDefaultGatewayProfileDto
  ) {
    await this.settingsService.setDefaultGatewayProfile(dto.profileName, user.id, orgId);
    return { profileName: dto.profileName };
  }
}
