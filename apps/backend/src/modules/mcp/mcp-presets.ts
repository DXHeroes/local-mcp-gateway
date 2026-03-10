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
    description: 'GitHub API access (repos, issues, PRs)',
    type: 'external',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
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
];
