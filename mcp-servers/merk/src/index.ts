/**
 * Merk MCP Package
 *
 * Czech and Slovak company data — financials, relations, employees, fleet, and more.
 * API docs: https://api.merk.cz/docs/
 */

import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { MerkMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'merk',
    name: 'Merk',
    description:
      'Czech and Slovak company data — financials, relations, employees, fleet, and more.',
    version: '1.0.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: true,
    apiKeyHint: 'Get your API key at https://www.merk.cz/api/about/',
    apiKeyDefaults: {
      headerName: 'Authorization',
      headerValueTemplate: 'Token {apiKey}',
    },
    tags: ['company-data', 'czech', 'slovak', 'financial', 'business-intelligence'],
    icon: '🏢',
    docsUrl: 'https://api.merk.cz/docs/',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new MerkMcpServer(apiKeyConfig);
  },

  seed: {
    defaultProfile: 'default',
    defaultOrder: 10,
    defaultActive: true,
  },
};

export type { McpPackage } from '@dxheroes/local-mcp-core';
export { MerkApiError, MerkClient } from './client.js';
export { MerkMcpServer } from './server.js';

export default mcpPackage;
