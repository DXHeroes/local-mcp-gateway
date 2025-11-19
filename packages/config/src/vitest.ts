import type { ViteUserConfig } from 'vitest/config';

/**
 * Shared Vitest configuration
 * Used by all packages and apps in the monorepo
 */
export const sharedVitestConfig: ViteUserConfig = {
  test: {
    globals: true,
    passWithNoTests: true,
  },
};

export function createVitestConfig(): ViteUserConfig {
  return { ...sharedVitestConfig };
}
