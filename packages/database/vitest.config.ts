import { createVitestConfig } from '@dxheroes/local-mcp-config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(createVitestConfig(), defineConfig({}));
