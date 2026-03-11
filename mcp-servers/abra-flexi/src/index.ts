/**
 * Abra Flexi MCP Package
 *
 * Invoices, contacts, products, and accounting via the Abra Flexi REST API.
 * API docs: https://www.abra.eu/rest-api-flexi/
 */

import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { FlexiMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'abra-flexi',
    name: 'Abra Flexi',
    description: 'Invoices, contacts, products, and accounting via the Abra Flexi REST API.',
    version: '0.1.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: true,
    apiKeyHint:
      'Format: https://server/c/company|username:password (e.g., "https://demo.flexibee.eu/c/demo|admin:admin"). The URL must include /c/company-name.',
    apiKeyDefaults: {
      headerName: 'Authorization',
      headerValueTemplate: 'Basic {apiKey}',
    },
    tags: ['erp', 'abra', 'flexibee', 'czech', 'accounting', 'invoicing'],
    icon: '📊',
    docsUrl: 'https://www.abra.eu/rest-api-flexi/',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new FlexiMcpServer(apiKeyConfig);
  },

  seed: {},
};

export type { McpPackage } from '@dxheroes/local-mcp-core';
export { FlexiApiError, FlexiClient } from './client.js';
export { FlexiMcpServer } from './server.js';

export default mcpPackage;
