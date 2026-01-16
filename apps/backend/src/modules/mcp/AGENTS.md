# MCP Module

## Description

Core MCP server management module. Handles MCP server CRUD, auto-discovery of MCP packages, and the in-memory registry.

## Contents

- `mcp.module.ts` - Module definition with all MCP services
- `mcp.controller.ts` - REST API for MCP server management
- `mcp.service.ts` - MCP server CRUD and connection management
- `mcp-discovery.service.ts` - Auto-discovery of MCP packages from `mcp-servers/`
- `mcp-registry.ts` - In-memory registry of discovered MCP packages
- `mcp-seed.service.ts` - Database seeding for discovered packages
- `dto/` - Data transfer objects for API validation

## Key Endpoints

- `GET /api/mcp-servers` - List all MCP servers
- `POST /api/mcp-servers` - Create new MCP server
- `GET /api/mcp-servers/:id` - Get MCP server details
- `PUT /api/mcp-servers/:id` - Update MCP server
- `DELETE /api/mcp-servers/:id` - Delete MCP server

## Key Concepts

- **Server Types**: builtin, custom, remote_http, remote_sse, external
- **Auto-Discovery**: Scans `mcp-servers/` for packages with `mcpPackage: true`
- **Registry**: In-memory store of discovered package metadata
- **Seeding**: Creates database records for discovered packages on startup

## MCP Package Discovery Flow

1. `McpDiscoveryService.onModuleInit()` - Scan dependencies
2. Filter packages with `mcpPackage: true` in package.json
3. Import and validate McpPackage interface
4. Register in `McpRegistry`
5. `McpSeedService` creates database records
