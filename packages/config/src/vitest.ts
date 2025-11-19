import type { UserConfig } from 'vitest/config';

/**
 * Shared Vitest configuration
 * Used by all packages and apps in the monorepo
 */
export const sharedVitestConfig: UserConfig = {
  test: {
    globals: true,
    passWithNoTests: true,
  },
};

export function createVitestConfig(): UserConfig {
  return { ...sharedVitestConfig };
}
