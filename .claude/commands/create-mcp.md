# Create MCP Server Package

Create a new MCP server package for the Local MCP Gateway application.

## Instructions

You are helping the user create a new MCP server package. This creates a standalone npm package in `mcp-servers/` that will be auto-discovered by the backend.

### Step 1: Gather Information

Ask the user for:
1. **Name**: What should this MCP server be called? (e.g., "Weather API", "GitHub Search")
2. **Description**: Brief description of what it does
3. **Tools**: What tools should this MCP provide?
   - For each tool: name, description, parameters (with types and descriptions)
4. **API Key Required?**: Does this MCP need an external API key?
   - If yes, what service/API does it connect to?
5. **Auto-seed?**: Should it be added to default profile automatically?

### Step 2: Generate Package Structure

Create in `mcp-servers/{kebab-name}/`:

```
mcp-servers/{kebab-name}/
├── src/
│   ├── index.ts          # Main export with McpPackage
│   ├── server.ts         # MCP server implementation
│   └── client.ts         # External API client (if needed)
├── __tests__/
│   └── server.test.ts    # Unit tests
├── package.json
├── tsconfig.json
└── AGENTS.md             # Package documentation
```

### Step 3: Verify

Run `pnpm install` to register the package.
Run `pnpm build` to verify TypeScript compilation.
Run `pnpm dev:backend` - package should be auto-discovered!

## Template: package.json

```json
{
  "name": "@dxheroes/mcp-{kebab-name}",
  "version": "1.0.0",
  "description": "{Description}",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "mcpPackage": true,
  "scripts": {
    "build": "tsc --build",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "keywords": ["mcp", "local-mcp-gateway"],
  "peerDependencies": {
    "@dxheroes/local-mcp-core": "workspace:*"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.8"
  }
}
```

## Template: src/index.ts

```typescript
import type { McpPackage, ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { {PascalName}McpServer } from './server';

/**
 * {Name} MCP Package
 *
 * {Description}
 */
export const mcpPackage: McpPackage = {
  metadata: {
    id: '{kebab-name}',
    name: '{Name}',
    description: '{Description}',
    version: '1.0.0',
    author: 'Your Name',
    license: 'MIT',
    requiresApiKey: {requiresApiKey},
    apiKeyHint: '{API key hint or undefined}',
    apiKeyDefaults: {requiresApiKey} ? {
      headerName: 'Authorization',
      headerValueTemplate: 'Bearer {apiKey}',
    } : undefined,
    tags: [{tags}],
    icon: '{emoji}',
    docsUrl: '{docs URL or undefined}',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new {PascalName}McpServer(apiKeyConfig);
  },

  seed: {
    defaultProfile: 'default',  // or null to skip
    defaultOrder: 10,
    defaultActive: true,
  },
};

// Re-exports
export { {PascalName}McpServer } from './server';
export type { McpPackage } from '@dxheroes/local-mcp-core';

// Default export
export default mcpPackage;
```

## Template: src/server.ts

```typescript
/**
 * {Name} MCP Server
 *
 * {Description}
 */

import { McpServer } from '@dxheroes/local-mcp-core';
import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { z } from 'zod';

// Input schema for the main tool
const {ToolName}InputSchema = z.object({
  // Define parameters here
  query: z.string().describe('The search query'),
});

type {ToolName}Input = z.infer<typeof {ToolName}InputSchema>;

export class {PascalName}McpServer extends McpServer {
  private apiKey: string | null = null;
  private initError: string | null = null;

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    if (this.apiKeyConfig?.apiKey) {
      this.apiKey = this.apiKeyConfig.apiKey;
      this.initError = null;
    } else {
      this.initError = '{Service} API key is not configured.';
    }
  }

  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: '{tool_name}',
        description: '{Tool description}',
        inputSchema: {ToolName}InputSchema,
      },
    ];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    if (name !== '{tool_name}') {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'UNKNOWN_TOOL', message: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }

    if (!this.apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'API_KEY_REQUIRED',
              message: this.initError || '{Service} API key is not configured.',
              configurationHint: 'Go to MCP Servers > {Name} > Configure API Key',
            }),
          },
        ],
        isError: true,
      };
    }

    let input: {ToolName}Input;
    try {
      input = {ToolName}InputSchema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'INVALID_INPUT',
                message: 'Invalid input parameters',
                details: error.issues,
              }),
            },
          ],
          isError: true,
        };
      }
      throw error;
    }

    try {
      // Implement tool logic here
      const result = { success: true, data: {} };

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'TOOL_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
        isError: true,
      };
    }
  }

  async listResources(): Promise<McpResource[]> {
    return [];
  }

  async readResource(_uri: string): Promise<unknown> {
    throw new Error('No resources available in {Name} MCP');
  }
}
```

## Template: tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "noEmit": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "__tests__"],
  "references": [
    {
      "path": "../../packages/core"
    }
  ]
}
```

## Template: AGENTS.md

```markdown
# {Name} MCP Package

## Purpose

{Description}

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - MCP server packages instructions

## Structure

```
{kebab-name}/
├── src/
│   ├── index.ts          # McpPackage export
│   ├── server.ts         # MCP server implementation
│   └── client.ts         # API client (if applicable)
├── __tests__/
│   └── server.test.ts
├── package.json
└── tsconfig.json
```

## Tools

- **{tool_name}**: {Tool description}

## API Key

{If requiresApiKey}: Requires {Service} API key. Get one at {URL}.
{If not}: No API key required.

## Development

```bash
# Build
pnpm --filter @dxheroes/mcp-{kebab-name} build

# Test
pnpm --filter @dxheroes/mcp-{kebab-name} test
```
```

## Important Files Reference

- **McpPackage interface**: `/packages/core/src/types/mcp-package.ts`
- **McpServer base class**: `/packages/core/src/abstractions/McpServer.ts`
- **Example package**: `/mcp-servers/gemini-deep-research/`
- **Discovery service**: `/apps/backend/src/modules/mcp/mcp-discovery.service.ts`
- **Seed service**: `/apps/backend/src/modules/mcp/mcp-seed.service.ts`

## Naming Conventions

| Format | Example | Usage |
|--------|---------|-------|
| PascalCase | `WeatherApi` | Class names |
| camelCase | `weatherApi` | Variable names |
| kebab-case | `weather-api` | Package name, directory, metadata.id |
| snake_case | `weather_api` | Tool names |

## How Auto-Discovery Works

1. Backend starts and `McpDiscoveryService` scans all dependencies
2. Packages with `"mcpPackage": true` in package.json are loaded
3. Each package's `mcpPackage` export is validated
4. `McpSeedService` creates database records for new packages
5. Package is registered in `McpRegistry` for runtime use

## Adding the Package to Backend

After creating the package, add it as a dependency to the backend:

```bash
# In apps/backend/package.json, add:
"@dxheroes/mcp-{kebab-name}": "workspace:*"

# Then run:
pnpm install
```

The package will be auto-discovered on next backend start.
