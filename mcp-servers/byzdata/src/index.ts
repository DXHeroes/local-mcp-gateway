import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { ByzdataMcpServer } from './server.js';

/**
 * ByzData MCP Package
 *
 * Czech business registry data from ARES, Justice.cz, and ISIR.
 * Provides tools for searching companies, checking health, insolvency,
 * relations, documents, and more.
 */
export const mcpPackage: McpPackage = {
  metadata: {
    id: 'byzdata',
    name: 'ByzData',
    description:
      'Czech business registry MCP — search companies, check health, insolvency, ' +
      'relations, documents from ARES, Justice.cz, and ISIR. 9 tools for comprehensive ' +
      'Czech company data analysis.',
    version: '1.0.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: false,
    tags: ['czech', 'business', 'registry', 'ares', 'justice', 'company', 'insolvency'],
    icon: '🏢',
  },

  createServer: (_apiKeyConfig: ApiKeyConfig | null) => {
    return new ByzdataMcpServer();
  },

  seed: {
    defaultProfile: 'default',
    defaultOrder: 20,
    defaultActive: true,
  },
};

export { ByzdataMcpServer } from './server.js';
export type { McpPackage } from '@dxheroes/local-mcp-core';

export default mcpPackage;
