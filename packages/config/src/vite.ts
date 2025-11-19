import type { UserConfig } from 'vite';

/**
 * Shared Vite configuration
 * Used by all packages and apps that use Vite
 */
export const sharedViteConfig: Partial<UserConfig> = {
  // Common Vite settings
  build: {
    sourcemap: true,
  },
  // Shared resolve configuration
  resolve: {
    // Common aliases can be added here
  },
};

export function createViteConfig(): Partial<UserConfig> {
  return { ...sharedViteConfig };
}
