# Packages Documentation

Overview of all packages in the Local MCP Gateway monorepo.

## Overview

Local MCP Gateway uses a monorepo structure with shared packages.

---

## Package Structure

```
packages/
├── core/           # Core business logic
├── database/       # Database layer
├── ui/             # Shared UI components
└── config/         # Shared configuration
```

---

## Package Summary

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `@local-mcp/core` | MCP abstractions and logic | - |
| `@local-mcp/database` | SQLite + Drizzle ORM | core |
| `@local-mcp/ui` | React components | - |
| `@local-mcp/config` | Shared TypeScript config | - |

---

## @local-mcp/core

Core business logic and MCP protocol handling.

### Exports

```typescript
// Abstractions
export { McpServer } from './abstractions/McpServer';
export { RemoteHttpMcpServer } from './abstractions/RemoteHttpMcpServer';
export { RemoteSseMcpServer } from './abstractions/RemoteSseMcpServer';
export { ExternalMcpServer } from './abstractions/ExternalMcpServer';
export { ProxyHandler } from './abstractions/ProxyHandler';
export { OAuthManager } from './abstractions/OAuthManager';
export { OAuthDiscoveryService } from './abstractions/OAuthDiscoveryService';

// Factories
export { McpServerFactory } from './factories/McpServerFactory';

// Types
export * from './types';
```

### Installation

```bash
pnpm add @local-mcp/core
```

### Usage

```typescript
import { ProxyHandler, McpServerFactory } from '@local-mcp/core';
```

---

## @local-mcp/database

Database layer with SQLite and Drizzle ORM.

### Exports

```typescript
// Database instance
export { createDb, db } from './db';

// Schema
export * from './schema';

// Types
export type { Profile, McpServer, OAuthToken } from './types';
```

### Installation

```bash
pnpm add @local-mcp/database
```

### Usage

```typescript
import { db, profiles, mcpServers } from '@local-mcp/database';

const allProfiles = await db.query.profiles.findMany();
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `~/.local-mcp-gateway-data/...` | Database file path |

---

## @local-mcp/ui

Shared React UI components based on **shadcn-ui** pattern with TailwindCSS v4 and Radix UI primitives.

> **Detailed Documentation:**
> - [UI Package Overview](./ui.md) - Installation, exports, dependencies
> - [Component API Reference](./ui-components.md) - All 15 components with props
> - [Theming Guide](./ui-theming.md) - CSS variables, dark mode
> - [Radix UI Patterns](./ui-radix-patterns.md) - Integration patterns

### Components

| Category | Components |
|----------|------------|
| **Form Controls** | Button, Checkbox, Input, Label, RadioGroup, Select, Textarea |
| **Dialogs** | Dialog, AlertDialog |
| **Feedback** | Alert, Badge, Toast, Tooltip |
| **Layout** | Card |

### Quick Start

```bash
pnpm add @dxheroes/local-mcp-ui
```

```tsx
import { Button, Card, CardContent, Input } from '@dxheroes/local-mcp-ui';
import '@dxheroes/local-mcp-ui/styles';

function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button variant="default">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Key Features

- **15 Components** - Form controls, dialogs, feedback, layout
- **Radix UI** - 8 accessible primitives
- **TailwindCSS v4** - Modern styling with CSS variables
- **Dark Mode** - Toggle with `.dark` class
- **TypeScript** - Full type safety

---

## @local-mcp/config

Shared TypeScript and build configuration.

### Contents

```
packages/config/
├── typescript/
│   ├── base.json        # Base TS config
│   ├── react.json       # React TS config
│   └── node.json        # Node.js TS config
├── eslint/
│   └── base.js          # Base ESLint config
└── tailwind/
    └── base.js          # Base Tailwind config
```

### Usage

**tsconfig.json:**
```json
{
  "extends": "@local-mcp/config/typescript/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

**tailwind.config.js:**
```javascript
import baseConfig from '@local-mcp/config/tailwind/base';

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}']
};
```

---

## Package Dependencies

```
                    @local-mcp/config
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  @local-mcp/core   @local-mcp/ui   @local-mcp/database
        │                                   │
        └───────────────────────────────────┘
                          │
                          ▼
                    apps/backend
                          │
                          ▼
                    apps/frontend
```

---

## Development

### Build All Packages

```bash
pnpm build
```

### Build Specific Package

```bash
pnpm --filter @local-mcp/core build
```

### Watch Mode

```bash
pnpm --filter @local-mcp/core dev
```

### Type Check

```bash
pnpm --filter @local-mcp/core typecheck
```

---

## Adding Dependencies

### To Specific Package

```bash
pnpm --filter @local-mcp/core add lodash
```

### As Dev Dependency

```bash
pnpm --filter @local-mcp/core add -D @types/lodash
```

### To Root (Workspace)

```bash
pnpm add -D -w typescript
```

---

## Creating New Package

1. Create directory:
```bash
mkdir packages/new-package
```

2. Initialize package.json:
```json
{
  "name": "@local-mcp/new-package",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  }
}
```

3. Add to workspace:
```bash
pnpm install
```

---

## See Also

- [Monorepo Structure](../architecture/monorepo-structure.md) - Project layout
- [Core Package](../core/README.md) - Core documentation
- [Database](../database/README.md) - Database documentation
