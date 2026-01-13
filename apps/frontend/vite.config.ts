import path from 'node:path';
import { createViteConfig } from '@dxheroes/local-mcp-config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default createViteConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dxheroes/local-mcp-ui/styles': path.resolve(
        __dirname,
        '../../packages/ui/src/styles/globals.css'
      ),
    },
  },
  server: {
    port: 3000,
    strictPort: true, // Fail if port is already in use - prevents conflicts with backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
