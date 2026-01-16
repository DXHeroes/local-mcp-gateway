/**
 * Settings Controller
 *
 * REST API endpoints for gateway settings management.
 */

import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
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
  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  /**
   * Get the default gateway profile setting
   */
  @Get('default-gateway-profile')
  async getDefaultGatewayProfile() {
    const profileName = await this.settingsService.getDefaultGatewayProfile();
    return { profileName };
  }

  /**
   * Set the default gateway profile
   */
  @Put('default-gateway-profile')
  async setDefaultGatewayProfile(@Body() dto: UpdateDefaultGatewayProfileDto) {
    await this.settingsService.setDefaultGatewayProfile(dto.profileName);
    return { profileName: dto.profileName };
  }
}
