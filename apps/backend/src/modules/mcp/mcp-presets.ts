/**
 * MCP Preset Gallery Definitions
 *
 * Hardcoded preset templates for popular MCP servers.
 * Users can add these to their organization via the gallery UI.
 * These replace the old auto-seeded external presets.
 */

export interface McpPreset {
  id: string;
  name: string;
  description: string;
  type: 'external' | 'remote_http';
  config: Record<string, unknown>;
  requiresApiKey?: boolean;
  icon?: string;
  docsUrl?: string;
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string;
  };
}

export const MCP_PRESETS: McpPreset[] = [
  {
    id: 'playwright',
    name: 'Playwright MCP',
    description: 'Browser automation and testing via Playwright',
    type: 'external',
    config: {
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    },
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Step-by-step reasoning and problem decomposition',
    type: 'external',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    },
  },
  {
    id: 'filesystem',
    name: 'Filesystem MCP',
    description: 'File system operations (read, write, search)',
    type: 'external',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },
  },
  {
    id: 'memory',
    name: 'Memory MCP',
    description: 'Persistent memory and knowledge graph',
    type: 'external',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
  {
    id: 'github',
    name: 'GitHub MCP',
    description: 'GitHub API access (repos, issues, PRs, actions, projects)',
    type: 'remote_http',
    config: {
      url: 'https://api.githubcopilot.com/mcp/',
      headers: {
        'X-MCP-Toolsets': 'default,actions,projects',
        'X-MCP-Lockdown': 'false',
      },
    },
    requiresApiKey: true,
    apiKeyDefaults: {
      headerName: 'Authorization',
      headerValueTemplate: 'Bearer {apiKey}',
    },
  },
  {
    id: 'fetch',
    name: 'Fetch MCP',
    description: 'HTTP fetch and web content retrieval',
    type: 'external',
    config: {
      command: 'uvx',
      args: ['mcp-server-fetch'],
    },
  },
  {
    id: 'context7',
    name: 'Context7',
    description: 'Up-to-date documentation and code examples for libraries',
    type: 'remote_http',
    config: {
      url: 'https://mcp.context7.com/mcp',
    },
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error tracking, performance monitoring, and debugging',
    type: 'remote_http',
    config: {
      url: 'https://mcp.sentry.dev/mcp',
    },
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics, feature flags, and session replay',
    type: 'remote_http',
    config: {
      url: 'https://mcp.posthog.com/mcp',
    },
  },
  {
    id: 'attio',
    name: 'Attio',
    description: 'CRM platform for managing contacts, companies, and deals',
    type: 'remote_http',
    config: {
      url: 'https://mcp.attio.com/mcp',
    },
  },
];
