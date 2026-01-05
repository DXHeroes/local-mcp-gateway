# Monorepo Structure

Local MCP Gateway uses a monorepo architecture managed by Turborepo and pnpm workspaces.

## Directory Structure

```
local-mcp-gateway/
├── apps/                          # Applications
│   ├── backend/                   # Express.js API server
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point
│   │   │   ├── routes/           # API routes
│   │   │   ├── middleware/       # Express middleware
│   │   │   └── lib/              # Utilities
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                  # React SPA
│       ├── src/
│       │   ├── main.tsx          # Entry point
│       │   ├── App.tsx           # Root component
│       │   ├── pages/            # Page components
│       │   ├── components/       # Shared components
│       │   └── config/           # Configuration
│       ├── package.json
│       └── vite.config.ts
│
├── packages/                      # Shared packages
│   ├── core/                      # Core business logic
│   │   ├── src/
│   │   │   ├── abstractions/     # MCP server classes
│   │   │   ├── types/            # TypeScript types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── database/                  # Data layer
│   │   ├── src/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   ├── database.ts       # DB connection
│   │   │   ├── repositories/     # Data access
│   │   │   ├── migrations/       # DB migrations
│   │   │   └── seeds/            # Seed data
│   │   └── package.json
│   │
│   ├── ui/                        # UI component library
│   │   ├── src/
│   │   │   └── components/       # shadcn/ui components
│   │   └── package.json
│   │
│   ├── config/                    # Shared configs
│   │   ├── tsconfig/             # TypeScript configs
│   │   └── package.json
│   │
│   └── custom-mcp-loader/         # Custom MCP loader
│       ├── src/
│       └── package.json
│
├── custom-mcps/                   # User custom MCPs
│   └── example/                   # Example custom MCP
│
├── docs/                          # Documentation
├── spec/                          # Specifications
├── scripts/                       # Build scripts
│
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # Workspace config
├── turbo.json                    # Turborepo config
├── tsconfig.json                 # Root TS config
└── biome.json                    # Biome config
```

---

## Packages Overview

### Apps

#### `apps/backend`

Express.js server providing:
- REST API for profile/server management
- MCP proxy endpoints
- OAuth handling
- WebSocket support

**Dependencies**: `@local-mcp/core`, `@local-mcp/database`

#### `apps/frontend`

React application providing:
- Profile management UI
- Server configuration UI
- Debug log viewer

**Dependencies**: `@local-mcp/ui`

### Packages

#### `packages/core`

Core business logic:
- MCP server abstractions
- ProxyHandler
- OAuth manager
- Type definitions

**Exports**:
- `McpServer`, `RemoteHttpMcpServer`, `RemoteSseMcpServer`
- `ProxyHandler`
- `McpServerFactory`
- `OAuthManager`, `OAuthDiscoveryService`

#### `packages/database`

Data persistence:
- Drizzle ORM schema
- Repository classes
- Migrations

**Exports**:
- Schema types
- Repository classes
- Database connection

#### `packages/ui`

React components:
- shadcn/ui based components
- Tailwind CSS styles

**Exports**:
- `Button`, `Card`, `Dialog`, etc.
- Style utilities

#### `packages/config`

Shared configurations:
- TypeScript configs
- Vitest configs
- Vite configs

#### `packages/custom-mcp-loader`

Dynamic MCP loading:
- TypeScript module loader
- Hot reload support

---

## Package Dependencies

```
                    ┌─────────────┐
                    │   config    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    core     │    │  database   │    │     ui      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
               ┌──────────┴──────────┐
               │                     │
               ▼                     ▼
        ┌─────────────┐       ┌─────────────┐
        │   backend   │       │  frontend   │
        └─────────────┘       └─────────────┘
```

---

## Build System

### Turborepo

Configuration in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Build Order

```
1. packages/config (no deps)
2. packages/core, packages/database, packages/ui (depend on config)
3. apps/backend, apps/frontend (depend on packages)
```

---

## Package.json Scripts

### Root Scripts

```json
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "test": "turbo run test",
  "lint": "turbo run lint"
}
```

### Backend Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

### Frontend Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Package References

Packages reference each other using workspace protocol:

```json
{
  "dependencies": {
    "@local-mcp/core": "workspace:*",
    "@local-mcp/database": "workspace:*"
  }
}
```

---

## TypeScript Configuration

### Root tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/database" },
    { "path": "./apps/backend" },
    { "path": "./apps/frontend" }
  ]
}
```

### Package tsconfig.json

Each package extends base config and declares its references.

---

## Adding New Packages

### 1. Create Package Directory

```bash
mkdir -p packages/new-package/src
```

### 2. Create package.json

```json
{
  "name": "@local-mcp/new-package",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "@local-mcp/config/tsconfig/base.json",
  "include": ["src"]
}
```

### 4. Add to Consuming Packages

```json
{
  "dependencies": {
    "@local-mcp/new-package": "workspace:*"
  }
}
```

### 5. Run Install

```bash
pnpm install
```

---

## See Also

- [System Overview](./system-overview.md) - Architecture
- [Contributing](../../contributing/development-setup.md) - Dev setup
