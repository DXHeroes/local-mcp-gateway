/**
 * Shared Vitest configuration
 * Used by all packages and apps in the monorepo
 */
export const sharedVitestConfig = {
  test: {
    globals: true,
    passWithNoTests: true,
  },
} as const;
