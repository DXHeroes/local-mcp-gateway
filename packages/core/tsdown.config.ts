import { createTsdownConfig } from '@local-mcp/config/tsdown';

export default createTsdownConfig({
  entry: ['./src/index.ts'],
  dts: {
    resolve: true,
  },
});
