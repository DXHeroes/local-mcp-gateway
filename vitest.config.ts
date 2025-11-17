import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/__tests__/**',
        '**/*.config.*',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/e2e/**',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      all: true,
    },
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@local-mcp/core': path.resolve(__dirname, './packages/core/src'),
      '@local-mcp/database': path.resolve(__dirname, './packages/database/src'),
      '@local-mcp/custom-mcp-loader': path.resolve(__dirname, './packages/custom-mcp-loader/src'),
    },
  },
});
