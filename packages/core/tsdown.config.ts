import { createTsdownConfig } from '@dxheroes/local-mcp-config/tsdown';

export default createTsdownConfig({
  entry: ['./src/index.ts'],
  dts: {
    resolve: true,
  },
});
