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
  clean: true,
  dts: true,
});
