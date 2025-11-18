import { defineConfig, type Config } from 'tsdown';

export const sharedTsdownConfig: Config = {
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
};

export function createTsdownConfig(config: Config = {}): Config {
  return defineConfig({
    ...sharedTsdownConfig,
    ...config,
  });
}

