/**
 * Fakturoid MCP Package
 *
 * Invoicing, contacts, expenses, and accounting via the Fakturoid API v3.
 * API docs: https://www.fakturoid.cz/api/v3
 */

import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { FakturoidMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'fakturoid',
    name: 'Fakturoid',
    description: 'Invoicing, contacts, expenses, and accounting via the Fakturoid API v3.',
    version: '0.1.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: true,
    apiKeyHint:
      'Format: slug:client_id:client_secret. Get your OAuth Client Credentials at Settings > User Account (Nastavení > Uživatelský účet) in your Fakturoid account. The slug is your account URL (e.g., "mycompany" from mycompany.fakturoid.cz).',
    tags: ['invoicing', 'fakturoid', 'czech', 'accounting', 'expenses'],
    icon: '🧾',
    docsUrl: 'https://www.fakturoid.cz/api/v3',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new FakturoidMcpServer(apiKeyConfig);
  },

  seed: {},
};

export type { McpPackage } from '@dxheroes/local-mcp-core';
export { FakturoidApiError, FakturoidClient } from './client.js';
export { FakturoidMcpServer } from './server.js';

export default mcpPackage;
