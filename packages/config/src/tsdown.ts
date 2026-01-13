import { defineConfig, type UserConfig } from 'tsdown';

export const sharedTsdownConfig: UserConfig = {
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
};

export function createTsdownConfig(config: UserConfig = {}): UserConfig {
  return defineConfig({
    ...sharedTsdownConfig,
    ...config,
  });
}
