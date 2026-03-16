/**
 * Settings Constants
 *
 * Defines setting keys, defaults, and reserved profile names.
 */

// Setting keys
export const SETTING_KEYS = {
  DEFAULT_GATEWAY_PROFILE: 'default_gateway_profile',
} as const;

// Default values for settings
export const SETTING_DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.DEFAULT_GATEWAY_PROFILE]: 'default',
};

// Reserved profile names that cannot be created by users
export const RESERVED_PROFILE_NAMES = ['gateway'] as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
