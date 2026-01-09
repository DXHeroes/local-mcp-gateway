/**
 * Gemini Deep Research MCP Package
 *
 * Provides deep research capabilities using Google's Deep Research Agent.
 * See: https://ai.google.dev/gemini-api/docs/deep-research
 */

import type { ApiKeyConfig, McpPackage } from '@dxheroes/local-mcp-core';
import { GeminiDeepResearchMcpServer } from './server.js';

/**
 * Gemini Deep Research MCP Package
 *
 * Provides comprehensive AI-powered research using Google's Deep Research Agent.
 * The agent autonomously searches the web, reads sources, and synthesizes findings
 * into detailed, cited reports. Tasks typically take 5-20 minutes.
 */
export const mcpPackage: McpPackage = {
  metadata: {
    id: 'gemini-deep-research',
    name: 'Gemini Deep Research',
    description:
      'Conducts comprehensive AI-powered research using Google\'s Deep Research Agent. ' +
      'Autonomously searches the web, reads multiple sources, and synthesizes findings into ' +
      'detailed, cited reports. Tasks take 5-20 minutes. Cost: ~$2-5 per research.',
    version: '2.0.0',
    author: 'DX Heroes',
    license: 'MIT',
    requiresApiKey: true,
    apiKeyHint: 'Get your API key at https://aistudio.google.com/apikey',
    apiKeyDefaults: {
      headerName: 'x-goog-api-key',
      headerValueTemplate: '{apiKey}',
    },
    tags: ['ai', 'research', 'google', 'gemini', 'deep-research', 'web-search', 'analysis'],
    icon: '✨',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/deep-research',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new GeminiDeepResearchMcpServer(apiKeyConfig);
  },

  seed: {
    defaultProfile: 'default',
    defaultOrder: 1,
    defaultActive: true,
  },
};

export type { McpPackage } from '@dxheroes/local-mcp-core';
// Re-exports for direct access
export { GeminiDeepResearchMcpServer } from './server.js';

// Default export
export default mcpPackage;
