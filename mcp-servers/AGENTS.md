# MCP Server Packages

## Purpose

This folder contains **standalone MCP server packages** that are automatically discovered and registered by the backend. Each package is an independent npm module that implements the MCP protocol.

## How Auto-Discovery Works

1. Backend starts (`apps/backend/`)
2. `McpDiscoveryService` scans all dependencies
3. Packages with `"mcpPackage": true` in `package.json` are detected
4. Each package's `mcpPackage` export is validated and registered
5. `McpSeedService` creates database records for new packages
6. Packages appear in UI and are available via MCP proxy

```
[McpModule] Initializing MCP Module...
[McpModule] Discovered 1 MCP packages
[McpModule] Registered: Gemini Deep Research (gemini-deep-research)
[McpModule] MCP Module initialization complete
```

## Creating a New MCP Package

### 1. Create Package Structure

```bash
mkdir -p mcp-servers/{your-package-name}/src
cd mcp-servers/{your-package-name}
```

### 2. Create `package.json`

```json
{
  "name": "@dxheroes/mcp-{your-package-name}",
  "version": "1.0.0",
  "description": "Your MCP server description",
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
    "test": "vitest run --passWithNoTests",
    "clean": "rm -rf dist"
  },
  "keywords": ["mcp", "local-mcp-gateway"],
  "peerDependencies": {
    "@dxheroes/local-mcp-core": "workspace:*"
  },
  "dependencies": {
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.8"
  }
}
```

**CRITICAL**: `"mcpPackage": true` is required for auto-discovery.

### 3. Create `src/index.ts`

```typescript
import type { McpPackage, ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { YourMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'your-package-name',        // kebab-case, must be unique
    name: 'Your Package Name',       // Display name
    description: 'What it does',
    version: '1.0.0',
    author: 'Your Name',
    license: 'MIT',
    requiresApiKey: true,            // or false
    apiKeyHint: 'Get API key at...',
    apiKeyDefaults: {
      headerName: 'Authorization',
      headerValueTemplate: 'Bearer {apiKey}',
    },
    tags: ['category1', 'category2'],
    icon: 'emoji-name',              // e.g., 'sparkles', 'search'
    docsUrl: 'https://...',
  },

  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new YourMcpServer(apiKeyConfig);
  },

  seed: {
    defaultProfile: 'default',       // Profile to add to (null = skip)
    defaultOrder: 10,                // Order in profile
    defaultActive: true,
  },
};

export { YourMcpServer } from './server.js';
export default mcpPackage;
```

### 4. Create `src/server.ts`

```typescript
import { McpServer } from '@dxheroes/local-mcp-core';
import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { z } from 'zod';

const MyToolInputSchema = z.object({
  query: z.string().describe('The search query'),
});

export class YourMcpServer extends McpServer {
  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    // Initialize client, validate API key, etc.
  }

  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: 'my_tool',
        description: 'What this tool does',
        inputSchema: MyToolInputSchema,
      },
    ];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    // Handle tool calls
    return { content: [{ type: 'text', text: 'Result' }] };
  }

  async listResources(): Promise<McpResource[]> {
    return [];
  }

  async readResource(uri: string): Promise<unknown> {
    throw new Error('No resources available');
  }
}
```

### 5. Create `tsconfig.json`

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
  "references": [{ "path": "../../packages/core" }]
}
```

### 6. Register and Build

```bash
# From root directory
pnpm install
pnpm build
```

Package will be auto-discovered on next backend start.

## Package Structure

```
mcp-servers/
├── AGENTS.md                           # This file
├── gemini-deep-research/               # Example package
│   ├── src/
│   │   ├── index.ts                    # McpPackage export
│   │   ├── server.ts                   # MCP server implementation
│   │   └── gemini-client.ts            # API client
│   ├── __tests__/                      # Unit tests
│   ├── package.json                    # mcpPackage: true
│   ├── tsconfig.json
│   └── AGENTS.md                       # Package documentation
└── {your-package}/                     # Your new package
```

## McpPackage Interface

```typescript
interface McpPackage {
  metadata: {
    id: string;              // Unique ID (kebab-case)
    name: string;            // Display name
    description: string;     // Description
    version: string;         // Semver version
    author?: string;
    license?: string;
    requiresApiKey: boolean;
    apiKeyHint?: string;
    apiKeyDefaults?: {
      headerName: string;
      headerValueTemplate: string;
    };
    requiresOAuth?: boolean;
    oauthDefaults?: {
      scopes: string[];
      authorizationServerUrl?: string;
    };
    tags?: string[];
    icon?: string;
    docsUrl?: string;
  };

  createServer: (apiKeyConfig: ApiKeyConfig | null) => McpServer;

  seed?: {
    defaultProfile?: string | null;
    defaultOrder?: number;
    defaultActive?: boolean;
    additionalData?: Record<string, unknown>;
  };
}
```

## Best Practices

1. **Unique IDs**: Use kebab-case IDs that won't conflict
2. **Validation**: Use Zod schemas for tool inputs
3. **Error Handling**: Return structured errors from `callTool`
4. **API Keys**: Check for API key in `initialize()` and return helpful errors
5. **Testing**: Add unit tests for server methods
6. **Documentation**: Create AGENTS.md in your package

## Naming Conventions

| Format | Example | Usage |
|--------|---------|-------|
| PascalCase | `GeminiDeepResearch` | Class names |
| camelCase | `geminiClient` | Variables, functions |
| kebab-case | `gemini-deep-research` | Package dirs, IDs |
| snake_case | `deep_research` | Tool names |

## Existing Packages

- **[gemini-deep-research/](gemini-deep-research/)** - Gemini AI deep research tool

## Related Files

- **Discovery Service**: `apps/backend/src/modules/mcp/mcp-discovery.service.ts`
- **Seed Service**: `apps/backend/src/modules/mcp/mcp-seed.service.ts`
- **Registry**: `apps/backend/src/modules/mcp/mcp-registry.ts`
- **Core Types**: `packages/core/src/types/mcp-package.ts`
- **Base McpServer**: `packages/core/src/abstractions/McpServer.ts`
