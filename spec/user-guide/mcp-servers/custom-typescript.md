# Custom TypeScript Servers

Custom TypeScript servers are dynamically loaded modules that run within the gateway process.

## Overview

| Aspect | Details |
|--------|---------|
| Transport | In-process |
| Language | TypeScript/JavaScript |
| Location | `custom-mcps/` directory |
| Use Case | Custom integrations, prototyping |

---

## How Custom MCPs Work

### Module Loading

1. Gateway scans `custom-mcps/` directory
2. Modules are dynamically imported
3. Module exports class extending `McpServer`
4. Instance created and registered

### Hot Reload (Future)

With hot reload enabled:
- File changes detected via `chokidar`
- Module reloaded automatically
- Tools updated without restart

---

## Creating a Custom MCP

### Step 1: Create Module Directory

```bash
mkdir -p custom-mcps/my-server
```

### Step 2: Create Module File

`custom-mcps/my-server/index.ts`:

```typescript
import { McpServer, McpTool, McpResource } from '@local-mcp/core';

export default class MyCustomServer extends McpServer {
  private initialized = false;

  async initialize(): Promise<void> {
    // Setup code here
    this.initialized = true;
  }

  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: 'my_custom_tool',
        description: 'Does something custom',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input value'
            }
          },
          required: ['input']
        }
      }
    ];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (name === 'my_custom_tool') {
      const input = args.input as string;
      return {
        content: [
          {
            type: 'text',
            text: `Processed: ${input}`
          }
        ]
      };
    }
    throw new Error(`Tool not found: ${name}`);
  }

  async listResources(): Promise<McpResource[]> {
    return [];
  }

  async readResource(uri: string): Promise<unknown> {
    throw new Error(`Resource not found: ${uri}`);
  }
}
```

### Step 3: Configure in Gateway

Via Web UI:
1. Go to **MCP Servers** → **"Add MCP Server"**
2. Select **Custom** type
3. Enter module path: `./custom-mcps/my-server`
4. Click **"Create"**

Or via API:
```json
{
  "name": "My Custom Server",
  "type": "custom",
  "config": {
    "modulePath": "./custom-mcps/my-server"
  }
}
```

---

## Module Structure

### Basic Structure

```
custom-mcps/
└── my-server/
    ├── index.ts       # Main module (exports McpServer class)
    ├── package.json   # Optional dependencies
    └── tsconfig.json  # Optional TS config
```

### With Dependencies

```
custom-mcps/
└── my-server/
    ├── index.ts
    ├── package.json
    ├── node_modules/  # Install with pnpm
    └── lib/
        └── helpers.ts
```

---

## McpServer Interface

### Required Methods

```typescript
abstract class McpServer {
  // Initialize connection/setup
  abstract initialize(): Promise<void>;

  // Return list of available tools
  abstract listTools(): Promise<McpTool[]>;

  // Execute a tool
  abstract callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown>;

  // Return list of available resources
  abstract listResources(): Promise<McpResource[]>;

  // Read a resource
  abstract readResource(uri: string): Promise<unknown>;
}
```

### Tool Definition

```typescript
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, JsonSchema>;
    required?: string[];
  };
}
```

### Tool Response

```typescript
interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

---

## Examples

### API Wrapper

```typescript
import { McpServer, McpTool } from '@local-mcp/core';

export default class WeatherServer extends McpServer {
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.WEATHER_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY not set');
    }
  }

  async listTools(): Promise<McpTool[]> {
    return [{
      name: 'get_weather',
      description: 'Get current weather for a city',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' }
        },
        required: ['city']
      }
    }];
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (name === 'get_weather') {
      const city = args.city as string;
      const response = await fetch(
        `https://api.weather.com/v1/current?city=${city}&key=${this.apiKey}`
      );
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data) }]
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  async listResources() { return []; }
  async readResource() { throw new Error('No resources'); }
}
```

### Database Query Tool

```typescript
import { McpServer, McpTool } from '@local-mcp/core';
import Database from 'better-sqlite3';

export default class SqliteServer extends McpServer {
  private db: Database.Database | null = null;

  async initialize(): Promise<void> {
    this.db = new Database('./data.db', { readonly: true });
  }

  async listTools(): Promise<McpTool[]> {
    return [{
      name: 'query',
      description: 'Execute a read-only SQL query',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query' }
        },
        required: ['sql']
      }
    }];
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (name === 'query' && this.db) {
      const sql = args.sql as string;

      // Safety: only allow SELECT
      if (!sql.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries allowed');
      }

      const results = this.db.prepare(sql).all();
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  async listResources() { return []; }
  async readResource() { throw new Error('No resources'); }
}
```

---

## Configuration Options

### Module Path

```json
{
  "config": {
    "modulePath": "./custom-mcps/my-server"
  }
}
```

Paths are relative to gateway root.

### Environment Variables

Pass configuration via environment:

```bash
MY_API_KEY=secret pnpm dev
```

Access in module:
```typescript
const apiKey = process.env.MY_API_KEY;
```

---

## Debugging Custom MCPs

### Console Logging

```typescript
console.log('Debug:', data);  // Shows in gateway logs
console.error('Error:', err); // Shows in stderr
```

### Error Handling

```typescript
async callTool(name: string, args: Record<string, unknown>) {
  try {
    // Tool logic
  } catch (error) {
    console.error('Tool error:', error);
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
}
```

### Testing Manually

Create a test script:

```typescript
import MyServer from './custom-mcps/my-server';

async function test() {
  const server = new MyServer();
  await server.initialize();

  const tools = await server.listTools();
  console.log('Tools:', tools);

  const result = await server.callTool('my_tool', { input: 'test' });
  console.log('Result:', result);
}

test().catch(console.error);
```

---

## Best Practices

### Error Handling

- Always catch and handle errors
- Return meaningful error messages
- Use `isError: true` for error responses

### Resource Management

- Clean up resources in module unload
- Don't hold open connections indefinitely
- Use connection pooling for databases

### Security

- Validate all inputs
- Don't expose sensitive data in errors
- Use environment variables for secrets
- Implement proper access control

### Performance

- Cache expensive operations
- Use async/await properly
- Avoid blocking the event loop

---

## Limitations

### No Hot Reload (Currently)

Changes require gateway restart. Hot reload planned for future.

### Single Process

Runs in gateway process. Errors can affect gateway stability.

### No OAuth

Custom servers don't have built-in OAuth. Use API keys or implement OAuth manually.

---

## See Also

- [External Stdio](./external-stdio.md) - Alternative for separate process
- [MCP Servers Overview](./README.md) - All server types
- [Core Abstractions](../../technical/core/README.md) - McpServer class details
