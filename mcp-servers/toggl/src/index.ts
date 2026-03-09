/**
 * Toggl Track MCP Package
 *
 * Time tracking, projects, clients, and reporting via the Toggl Track API.
 * API docs: https://engineering.toggl.com/docs/api/
 */

import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { TogglMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'toggl',
    name: 'Toggl Track',
    description: 'Time tracking, projects, clients, and reporting via the Toggl Track API.',
    version: '1.0.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: true,
    apiKeyHint: 'Get your API token at https://track.toggl.com/profile (scroll to "API Token")',
    apiKeyDefaults: {
      headerName: 'Authorization',
      headerValueTemplate: 'Basic {apiKey}',
    },
    tags: ['time-tracking', 'toggl', 'reports', 'productivity', 'projects'],
    icon: '⏱️',
    docsUrl: 'https://engineering.toggl.com/docs/api/',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new TogglMcpServer(apiKeyConfig);
  },

  seed: {
    defaultProfile: 'default',
    defaultOrder: 10,
    defaultActive: true,
  },
};

export type { McpPackage } from '@dxheroes/local-mcp-core';
export { TogglApiError, TogglClient } from './client.js';
export { TogglMcpServer } from './server.js';

export default mcpPackage;
