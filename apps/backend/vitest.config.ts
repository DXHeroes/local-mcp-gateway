import { createVitestConfig } from '@dxheroes/local-mcp-config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  createVitestConfig(),
  defineConfig({
    test: {
      root: '.',
      coverage: {
        provider: 'v8',
        thresholds: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  })
);
