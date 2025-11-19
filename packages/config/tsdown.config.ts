import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/vitest.ts',
    './src/typescript.ts',
    './src/vite.ts',
    './src/tsdown.ts',
  ],
  format: ['esm', 'cjs'],
  clean: false, // Don't clean in watch mode, only when building for production
  platform: 'node',
  external: ['publint/utils', 'unplugin-lightningcss/rolldown'],
  define: {
    'import.meta': '{}',
  },
});
