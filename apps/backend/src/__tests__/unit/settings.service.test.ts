/**
 * Tests for SettingsService
 *
 * Covers getSetting, setSetting, getDefaultGatewayProfile,
 * setDefaultGatewayProfile, and getAllSettings.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { SETTING_DEFAULTS, SETTING_KEYS } from '../../modules/settings/settings.constants.js';
import {
  GATEWAY_PROFILE_CHANGED,
  SettingsService,
} from '../../modules/settings/settings.service.js';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let eventEmitter: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      gatewaySetting: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockImplementation(async ({ create }) => create),
      },
      profile: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    eventEmitter = {
      emit: vi.fn(),
    };
    service = new SettingsService(prisma as unknown as PrismaService, eventEmitter as any);
  });

  // ── getSetting ──────────────────────────────────────────────────────

  describe('getSetting', () => {
    it('returns stored value when setting exists in DB', async () => {
      prisma.gatewaySetting.findUnique.mockResolvedValue({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'my-custom-profile',
      });

      const result = await service.getSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE);

      expect(result).toBe('my-custom-profile');
      expect(prisma.gatewaySetting.findUnique).toHaveBeenCalledWith({
        where: { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE },
      });
    });

    it('returns default value when setting is not found in DB', async () => {
      prisma.gatewaySetting.findUnique.mockResolvedValue(null);

      const result = await service.getSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE);

      expect(result).toBe(SETTING_DEFAULTS[SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]);
    });

    it('returns default value when setting record has null value', async () => {
      prisma.gatewaySetting.findUnique.mockResolvedValue({ key: 'k', value: null });

      const result = await service.getSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE);

      expect(result).toBe(SETTING_DEFAULTS[SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]);
    });
  });

  // ── setSetting ──────────────────────────────────────────────────────

  describe('setSetting', () => {
    it('upserts and returns key-value pair', async () => {
      prisma.gatewaySetting.upsert.mockResolvedValue({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'new-profile',
      });

      const result = await service.setSetting(SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, 'new-profile');

      expect(result).toEqual({ key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, value: 'new-profile' });
      expect(prisma.gatewaySetting.upsert).toHaveBeenCalledWith({
        where: { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE },
        update: { value: 'new-profile' },
        create: { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, value: 'new-profile' },
      });
    });
  });

  // ── getDefaultGatewayProfile ────────────────────────────────────────

  describe('getDefaultGatewayProfile', () => {
    it('delegates to getSetting with the correct key', async () => {
      prisma.gatewaySetting.findUnique.mockResolvedValue({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'production',
      });

      const result = await service.getDefaultGatewayProfile();

      expect(result).toBe('production');
      expect(prisma.gatewaySetting.findUnique).toHaveBeenCalledWith({
        where: { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE },
      });
    });

    it('returns default when no stored value exists', async () => {
      const result = await service.getDefaultGatewayProfile();

      expect(result).toBe('default');
    });
  });

  // ── setDefaultGatewayProfile ────────────────────────────────────────

  describe('setDefaultGatewayProfile', () => {
    it('validates, sets, and emits event for valid profile', async () => {
      prisma.profile.findFirst.mockResolvedValue({ id: 'p1', name: 'staging' });
      prisma.gatewaySetting.upsert.mockResolvedValue({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'staging',
      });

      const result = await service.setDefaultGatewayProfile('staging');

      expect(result).toEqual({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'staging',
      });
      expect(prisma.profile.findFirst).toHaveBeenCalledWith({
        where: { name: 'staging' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(GATEWAY_PROFILE_CHANGED, {
        profileName: 'staging',
      });
    });

    it('trims whitespace from profile name', async () => {
      prisma.profile.findFirst.mockResolvedValue({ id: 'p1', name: 'staging' });
      prisma.gatewaySetting.upsert.mockResolvedValue({
        key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE,
        value: 'staging',
      });

      await service.setDefaultGatewayProfile('  staging  ');

      expect(prisma.profile.findFirst).toHaveBeenCalledWith({
        where: { name: 'staging' },
      });
    });

    it('throws BadRequestException for empty string', async () => {
      await expect(service.setDefaultGatewayProfile('')).rejects.toThrow(BadRequestException);
      expect(prisma.profile.findFirst).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for whitespace-only string', async () => {
      await expect(service.setDefaultGatewayProfile('   ')).rejects.toThrow(BadRequestException);
      expect(prisma.profile.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when profile does not exist', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.setDefaultGatewayProfile('nonexistent')).rejects.toThrow(
        NotFoundException
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does not emit event when profile is not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      try {
        await service.setDefaultGatewayProfile('missing');
      } catch {
        // expected
      }

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  // ── getAllSettings ──────────────────────────────────────────────────

  describe('getAllSettings', () => {
    it('returns defaults when no settings are stored', async () => {
      prisma.gatewaySetting.findMany.mockResolvedValue([]);

      const result = await service.getAllSettings();

      expect(result).toEqual(SETTING_DEFAULTS);
    });

    it('overrides defaults with stored values', async () => {
      prisma.gatewaySetting.findMany.mockResolvedValue([
        { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, value: 'custom-profile' },
      ]);

      const result = await service.getAllSettings();

      expect(result[SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]).toBe('custom-profile');
    });

    it('includes stored keys that have no default', async () => {
      prisma.gatewaySetting.findMany.mockResolvedValue([
        { key: 'some_extra_key', value: 'extra-value' },
      ]);

      const result = await service.getAllSettings();

      expect(result['some_extra_key']).toBe('extra-value');
      // defaults are still present
      expect(result[SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]).toBe(
        SETTING_DEFAULTS[SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]
      );
    });

    it('does not mutate SETTING_DEFAULTS', async () => {
      const originalDefaults = { ...SETTING_DEFAULTS };

      prisma.gatewaySetting.findMany.mockResolvedValue([
        { key: SETTING_KEYS.DEFAULT_GATEWAY_PROFILE, value: 'overridden' },
      ]);

      await service.getAllSettings();

      expect(SETTING_DEFAULTS).toEqual(originalDefaults);
    });
  });
});
