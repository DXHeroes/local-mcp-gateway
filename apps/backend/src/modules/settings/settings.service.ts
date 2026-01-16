/**
 * Settings Service
 *
 * Business logic for gateway settings management.
 * Emits events when gateway settings change for SSE notifications.
 */

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service.js';
import { SETTING_DEFAULTS, SETTING_KEYS, type SettingKey } from './settings.constants.js';

/** Event name for gateway profile changes */
export const GATEWAY_PROFILE_CHANGED = 'gateway.profile.changed';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Get a setting value by key, returns default if not set
   */
  async getSetting(key: SettingKey): Promise<string> {
    const setting = await this.prisma.gatewaySetting.findUnique({
      where: { key },
    });

    return setting?.value ?? SETTING_DEFAULTS[key];
  }

  /**
   * Set a setting value
   */
  async setSetting(key: SettingKey, value: string): Promise<{ key: string; value: string }> {
    const setting = await this.prisma.gatewaySetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return { key: setting.key, value: setting.value };
  }

  /**
   * Get the default gateway profile name
   */
  async getDefaultGatewayProfile(): Promise<string> {
    return this.getSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE);
  }

  /**
   * Set the default gateway profile
   * Validates that the profile exists before setting.
   * Emits GATEWAY_PROFILE_CHANGED event for SSE subscribers.
   */
  async setDefaultGatewayProfile(profileName: string): Promise<{ key: string; value: string }> {
    // Input sanitization
    const trimmedName = profileName?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Profile name cannot be empty');
    }

    // Validate that profile exists
    const profile = await this.prisma.profile.findUnique({
      where: { name: trimmedName },
    });

    if (!profile) {
      throw new NotFoundException(`Profile "${trimmedName}" not found`);
    }

    const result = await this.setSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, trimmedName);

    // Emit event for SSE subscribers (MCP Streamable HTTP notifications)
    this.eventEmitter.emit(GATEWAY_PROFILE_CHANGED, { profileName: trimmedName });

    return result;
  }

  /**
   * Get all settings with their current values
   */
  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.gatewaySetting.findMany();

    // Start with defaults
    const result: Record<string, string> = { ...SETTING_DEFAULTS };

    // Override with stored values
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }
}
