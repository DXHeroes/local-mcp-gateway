# Database Package (Prisma ORM)

## Purpose

SQLite database layer with **Prisma ORM**, providing type-safe database operations, generated TypeScript types, and Zod validation schemas. This package handles all database operations for the Local MCP Gateway.

**NOTE:** No user authentication tables - this is an open-source application where users can immediately use all features.

## Technology Stack

- **ORM**: Prisma 6.x
- **Database**: SQLite
- **Validation**: Zod (auto-generated from Prisma schema)
- **Type Generation**: Prisma Client + zod-prisma-types

## Structure

```
database/
├── prisma/
│   ├── schema.prisma              # Prisma schema (source of truth)
│   ├── migrations/                # Prisma migrations
│   └── dev.db                     # Development database
├── src/
│   ├── database.ts                # Database connection utilities
│   ├── generated/
│   │   ├── prisma/                # Generated Prisma Client
│   │   │   ├── index.js
│   │   │   ├── index.d.ts
│   │   │   └── ...
│   │   └── zod/                   # Generated Zod schemas
│   │       ├── index.ts
│   │       ├── modelSchema/       # Model validation schemas
│   │       └── inputTypeSchemas/  # Input/query schemas
│   ├── seeds/
│   │   └── seed.ts                # Seed data
│   └── index.ts                   # Package exports
├── package.json
└── tsconfig.json
```

## Database Schema

Models defined in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `Profile` | User-defined profiles for grouping MCP servers |
| `McpServer` | MCP server configurations (builtin/external/custom) |
| `ProfileMcpServer` | Many-to-many: profiles ↔ MCP servers |
| `ProfileMcpServerTool` | Per-profile tool customizations |
| `McpServerToolsCache` | Cache for tool metadata (change detection) |
| `OAuthToken` | OAuth tokens for MCP servers |
| `OAuthClientRegistration` | Dynamic OAuth client registrations (RFC 7591) |
| `DebugLog` | Debug logs for MCP requests/responses |
| `Migration` | Migration tracking |

## Key Commands

```bash
# Generate Prisma Client + Zod schemas
pnpm prisma:generate

# Create new migration
pnpm prisma:migrate:dev

# Apply migrations (production)
pnpm prisma:migrate:deploy

# Reset database
pnpm prisma:migrate:reset

# Open Prisma Studio (visual DB browser)
pnpm prisma:studio

# Push schema changes (development)
pnpm prisma:push

# Run seeds
pnpm prisma:seed

# Full reset with seeds
pnpm db:reset
```

## Usage Examples

### Basic Queries with Prisma Client

```typescript
import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';

const prisma = new PrismaClient();

// Find all profiles with their MCP servers
const profiles = await prisma.profile.findMany({
  include: {
    mcpServers: {
      include: { mcpServer: true },
      orderBy: { order: 'asc' },
    },
  },
});

// Find profile by name
const profile = await prisma.profile.findUnique({
  where: { name: 'default' },
});

// Create new profile
const newProfile = await prisma.profile.create({
  data: {
    name: 'my-profile',
    description: 'My custom profile',
  },
});

// Update profile
await prisma.profile.update({
  where: { id: profileId },
  data: { description: 'Updated description' },
});

// Delete profile (cascades to related records)
await prisma.profile.delete({
  where: { id: profileId },
});
```

### Validation with Generated Zod Schemas

```typescript
import { zodSchemas } from '@dxheroes/local-mcp-database';

// Validate profile creation input
const input = zodSchemas.ProfileCreateInputSchema.parse({
  name: 'my-profile',
  description: 'Description',
});

// Validate MCP server configuration
const serverInput = zodSchemas.McpServerCreateInputSchema.parse({
  name: 'My Server',
  type: 'builtin',
  config: '{"builtinId": "gemini-deep-research"}',
});

// Available schema types:
// - ProfileSchema, McpServerSchema, etc. (model schemas)
// - ProfileCreateInputSchema, ProfileUpdateInputSchema (input schemas)
// - ProfileWhereInputSchema, ProfileWhereUniqueInputSchema (query schemas)
// - ProfileIncludeSchema, ProfileSelectSchema (relation schemas)
```

### Using with NestJS

```typescript
// In NestJS service (apps/backend/src/modules/database/prisma.service.ts)
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// In any NestJS service
@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.profile.findMany({
      include: { mcpServers: true },
    });
  }
}
```

## Package Exports

```typescript
// Main exports from '@dxheroes/local-mcp-database'
import {
  PrismaClient,           // Database client
  Profile, McpServer,     // Model types
  Prisma,                 // Prisma namespace with input types
} from '@dxheroes/local-mcp-database';

// Zod schemas namespace
import { zodSchemas } from '@dxheroes/local-mcp-database';

// Direct imports for generated files
import { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';
import * as zodSchemas from '@dxheroes/local-mcp-database/generated/zod';
```

## Development Workflow

### Adding a New Model

1. **Edit schema**: `prisma/schema.prisma`
2. **Create migration**: `pnpm prisma:migrate:dev --name add_new_model`
3. **Generate client**: `pnpm prisma:generate`
4. **Build package**: `pnpm build`

### Modifying Existing Model

1. **Edit schema**: `prisma/schema.prisma`
2. **Create migration**: `pnpm prisma:migrate:dev --name modify_model`
3. **Regenerate**: `pnpm prisma:generate`

### Schema Change Without Migration (Dev Only)

```bash
# Push schema changes directly (loses data)
pnpm prisma:push
```

## Generated Files

After `pnpm prisma:generate`:

```
src/generated/
├── prisma/                    # Prisma Client
│   ├── index.js               # Client implementation
│   ├── index.d.ts             # TypeScript types
│   ├── schema.prisma          # Copy of schema
│   └── runtime/               # Prisma runtime
└── zod/                       # Zod schemas
    ├── index.ts               # All exports
    ├── modelSchema/           # Model validation
    │   ├── ProfileSchema.ts
    │   ├── McpServerSchema.ts
    │   └── ...
    └── inputTypeSchemas/      # Input/query validation
        ├── ProfileCreateInputSchema.ts
        ├── ProfileUpdateInputSchema.ts
        ├── ProfileWhereInputSchema.ts
        └── ...
```

## Environment Variables

```bash
# Database URL (SQLite file path)
DATABASE_URL="file:./dev.db"

# Production path
DATABASE_URL="file:/Users/username/.local-mcp-gateway-data/local-mcp-gateway.db"
```

## Security Considerations

- **No SQL injection**: Prisma uses parameterized queries
- **Input validation**: Use Zod schemas before database operations
- **Cascade deletes**: Properly configured in schema
- **JSON fields**: `config`, `oauthConfig`, `apiKeyConfig` store sensitive data

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Dependencies

- `@prisma/client` - Prisma database client
- `prisma` (dev) - Prisma CLI
- `zod` - Runtime validation
- `zod-prisma-types` (dev) - Zod schema generator

## Child Directories

- **[src/AGENTS.md](src/AGENTS.md)** - Source code documentation

## Related Files

- **Prisma Service**: `apps/backend/src/modules/database/prisma.service.ts`
- **NestJS Database Module**: `apps/backend/src/modules/database/database.module.ts`
- **Schema Definition**: `prisma/schema.prisma`
