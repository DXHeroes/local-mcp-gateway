# Backend Application (NestJS)

## Purpose

NestJS backend that serves as the MCP proxy server. Handles profile management, MCP server management, OAuth flows for MCP servers, API key management, and MCP proxy endpoints per profile.

**NOTE:** No user authentication required. All endpoints are public and immediately accessible.

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript (ES modules)
- **Database**: Prisma ORM with SQLite
- **Validation**: Zod (generated from Prisma schema)
- **Security**: Helmet, CORS, Rate limiting (@nestjs/throttler)

## Structure

```
backend/
├── src/
│   ├── main.ts                    # NestJS bootstrap
│   ├── app.module.ts              # Root module
│   ├── modules/
│   │   ├── database/              # Prisma service (global)
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── mcp/                   # MCP management, discovery, registry
│   │   │   ├── mcp.module.ts
│   │   │   ├── mcp.controller.ts
│   │   │   ├── mcp.service.ts
│   │   │   ├── mcp-discovery.service.ts
│   │   │   ├── mcp-seed.service.ts
│   │   │   └── mcp-registry.ts
│   │   ├── profiles/              # Profile CRUD
│   │   │   ├── profiles.module.ts
│   │   │   ├── profiles.controller.ts
│   │   │   └── profiles.service.ts
│   │   ├── oauth/                 # OAuth for MCP servers (not user auth)
│   │   │   ├── oauth.module.ts
│   │   │   ├── oauth.controller.ts
│   │   │   └── oauth.service.ts
│   │   ├── proxy/                 # MCP proxy endpoints
│   │   │   ├── proxy.module.ts
│   │   │   ├── proxy.controller.ts
│   │   │   └── proxy.service.ts
│   │   ├── health/                # Health checks
│   │   │   ├── health.module.ts
│   │   │   └── health.controller.ts
│   │   └── debug/                 # Debug logs
│   │       ├── debug.module.ts
│   │       ├── debug.controller.ts
│   │       └── debug.service.ts
│   ├── common/
│   │   ├── filters/               # Exception filters
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interceptors/          # Logging, timeout
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   └── pipes/                 # Validation
│   │       └── validation.pipe.ts
│   └── config/                    # App configuration
│       ├── app.config.ts
│       └── database.config.ts
├── test/
│   └── *.e2e-spec.ts             # E2E tests
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## Key Modules

### DatabaseModule (Global)
- **Purpose**: Provides PrismaService globally to all modules
- **Files**: `database.module.ts`, `prisma.service.ts`
- **Usage**: Inject `PrismaService` in any service

```typescript
@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.myModel.findMany();
  }
}
```

### McpModule
- **Purpose**: MCP package discovery, seeding, registry, and management
- **Key Services**:
  - `McpDiscoveryService`: Scans dependencies for `mcpPackage: true`
  - `McpSeedService`: Creates database records for discovered packages
  - `McpRegistry`: In-memory registry of MCP packages
  - `McpService`: CRUD operations for MCP servers

### ProfilesModule
- **Purpose**: Profile CRUD operations
- **Endpoints**:
  - `GET /api/profiles` - List all profiles
  - `GET /api/profiles/:id` - Get profile by ID
  - `POST /api/profiles` - Create profile
  - `PUT /api/profiles/:id` - Update profile
  - `DELETE /api/profiles/:id` - Delete profile
  - `POST /api/profiles/:id/servers` - Add server to profile
  - `DELETE /api/profiles/:id/servers/:serverId` - Remove server from profile

### ProxyModule
- **Purpose**: MCP proxy endpoints for Claude/AI clients
- **Endpoints**:
  - `POST /api/mcp/:profileName` - MCP JSON-RPC endpoint for profile

### OAuthModule
- **Purpose**: OAuth 2.1 flows for MCP servers (not user authentication)
- **Endpoints**:
  - `GET /api/oauth/authorize/:serverId` - Start OAuth flow
  - `GET /api/oauth/callback` - OAuth callback

### HealthModule
- **Purpose**: Health check endpoints
- **Endpoints**:
  - `GET /api/health` - Health status

### DebugModule
- **Purpose**: Debug logging for MCP traffic
- **Endpoints**:
  - `GET /api/debug/logs` - Get debug logs

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/profiles` | List profiles |
| GET | `/api/profiles/:id` | Get profile |
| POST | `/api/profiles` | Create profile |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |
| POST | `/api/profiles/:id/servers` | Add server to profile |
| DELETE | `/api/profiles/:id/servers/:serverId` | Remove server |
| GET | `/api/mcp-servers` | List MCP servers |
| GET | `/api/mcp-servers/available` | List available MCP packages |
| GET | `/api/mcp-servers/:id` | Get MCP server |
| POST | `/api/mcp-servers` | Create MCP server |
| PUT | `/api/mcp-servers/:id` | Update MCP server |
| DELETE | `/api/mcp-servers/:id` | Delete MCP server |
| GET | `/api/mcp-servers/:id/tools` | Get server tools |
| GET | `/api/mcp-servers/:id/status` | Get server status |
| POST | `/api/mcp/:profileName` | MCP proxy endpoint |
| GET | `/api/oauth/authorize/:serverId` | Start OAuth |
| GET | `/api/oauth/callback` | OAuth callback |
| GET | `/api/debug/logs` | Debug logs |

## Development

### Running

```bash
# Development with hot-reload
pnpm dev:backend

# Build
pnpm --filter backend build

# Production
pnpm --filter backend start:prod
```

### Adding a New Module

1. **Create module folder**:
   ```bash
   mkdir -p src/modules/my-feature
   ```

2. **Create files**:
   ```typescript
   // my-feature.module.ts
   import { Module } from '@nestjs/common';
   import { MyFeatureController } from './my-feature.controller';
   import { MyFeatureService } from './my-feature.service';

   @Module({
     controllers: [MyFeatureController],
     providers: [MyFeatureService],
     exports: [MyFeatureService],
   })
   export class MyFeatureModule {}

   // my-feature.controller.ts
   import { Controller, Get, Post, Body } from '@nestjs/common';
   import { MyFeatureService } from './my-feature.service';

   @Controller('my-feature')
   export class MyFeatureController {
     constructor(private readonly service: MyFeatureService) {}

     @Get()
     findAll() {
       return this.service.findAll();
     }
   }

   // my-feature.service.ts
   import { Injectable } from '@nestjs/common';
   import { PrismaService } from '../database/prisma.service';

   @Injectable()
   export class MyFeatureService {
     constructor(private readonly prisma: PrismaService) {}

     async findAll() {
       return this.prisma.myModel.findMany();
     }
   }
   ```

3. **Register in app.module.ts**:
   ```typescript
   import { MyFeatureModule } from './modules/my-feature/my-feature.module';

   @Module({
     imports: [
       // ... other modules
       MyFeatureModule,
     ],
   })
   export class AppModule {}
   ```

### Using Prisma

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  // Find all
  async findAll() {
    return this.prisma.profile.findMany({
      include: { mcpServers: true },
    });
  }

  // Find one
  async findById(id: string) {
    return this.prisma.profile.findUnique({
      where: { id },
    });
  }

  // Create
  async create(data: { name: string; description?: string }) {
    return this.prisma.profile.create({
      data,
    });
  }

  // Update
  async update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }

  // Delete
  async delete(id: string) {
    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
```

### Validation with Zod

Use generated Zod schemas from Prisma:

```typescript
import { ProfileCreateInputSchema } from '@dxheroes/local-mcp-database';

// In controller or service
const validated = ProfileCreateInputSchema.parse(input);
```

## Dependencies

### Core NestJS

- `@nestjs/common` - Common utilities
- `@nestjs/core` - Core framework
- `@nestjs/platform-express` - Express adapter
- `@nestjs/config` - Configuration
- `@nestjs/throttler` - Rate limiting

### Database

- `@dxheroes/local-mcp-database` - Prisma client and Zod schemas

### MCP

- `@modelcontextprotocol/sdk` - MCP SDK
- `@dxheroes/local-mcp-core` - Core types and abstractions

### Security

- `helmet` - Security headers
- `compression` - Response compression

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `DATABASE_URL` | `file:~/.local-mcp-gateway-data/...` | Prisma database URL |

## MCP Package Discovery

On module initialization (`onModuleInit`), the `McpModule`:

1. **Discovers packages**: `McpDiscoveryService` scans all dependencies
2. **Filters MCP packages**: Looks for `"mcpPackage": true` in package.json
3. **Registers packages**: Loads and registers in `McpRegistry`
4. **Seeds database**: `McpSeedService` creates records for new packages

```
[McpModule] Initializing MCP Module...
[McpModule] Discovered 1 MCP packages
[McpModule] Registered: Gemini Deep Research (gemini-deep-research)
[McpModule] MCP Module initialization complete
```

## Testing

```bash
# Run tests
pnpm --filter backend test

# Watch mode
pnpm --filter backend test:watch

# E2E tests
pnpm --filter backend test:e2e
```

## Child Directories

- **[src/AGENTS.md](src/AGENTS.md)** - Source code documentation

## Important Notes

- **No user authentication**: All endpoints are public
- **OAuth is for MCP servers**: Not user login
- **Prisma for database**: Type-safe queries
- **NestJS modules**: Clean separation of concerns
- **Auto-discovery**: MCP packages are auto-discovered on startup
