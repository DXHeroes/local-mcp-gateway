# Modules Directory

## Description

NestJS feature modules organized by domain. Each module encapsulates related functionality with its own controller, service, and DTOs.

## Subdirectories

- **[database/](database/AGENTS.md)** - Prisma database service (global module)
- **[debug/](debug/AGENTS.md)** - Debug logging for MCP traffic
- **[health/](health/AGENTS.md)** - Health check endpoints
- **[mcp/](mcp/AGENTS.md)** - MCP server management, discovery, and registry
- **[oauth/](oauth/AGENTS.md)** - OAuth 2.1 authentication for MCP servers
- **[profiles/](profiles/AGENTS.md)** - Profile CRUD operations
- **[proxy/](proxy/AGENTS.md)** - MCP proxy endpoints (HTTP/SSE)
- **[settings/](settings/AGENTS.md)** - Application settings management

## Module Structure Pattern

Each module typically contains:
- `*.module.ts` - Module definition with imports/providers/controllers
- `*.controller.ts` - REST API endpoints
- `*.service.ts` - Business logic and data access
- `dto/` - Data transfer objects (optional)

## Key Concepts

- Modules are self-contained units with clear boundaries
- Services use Prisma for database access
- Controllers handle HTTP requests and validation
- Dependency injection connects all components
