import path from 'node:path';
import { createViteConfig } from '@dxheroes/local-mcp-config/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vite';

export default defineConfig(
  mergeConfig(createViteConfig(), {
    plugins: [react()],
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'LocalMcpUI',
        fileName: 'index',
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          preserveModules: false,
        },
      },
      // Don't clean dist directory to preserve .d.ts files from TypeScript
      emptyOutDir: false,
    },
  })
);
