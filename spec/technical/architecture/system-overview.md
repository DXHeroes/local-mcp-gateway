# System Overview

High-level architecture of Local MCP Gateway.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           AI Clients                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Claude    │  │   Claude    │  │   Cursor    │                  │
│  │   Desktop   │  │    Code     │  │     IDE     │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          │    HTTP/SSE    │                │
          │  JSON-RPC 2.0  │                │
          └────────────────┼────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Local MCP Gateway                               │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Backend (Express.js)                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   Profiles  │  │ MCP Servers │  │    OAuth    │            │  │
│  │  │    Routes   │  │   Routes    │  │   Routes    │            │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │  │
│  │         │                │                │                    │  │
│  │         └────────────────┼────────────────┘                    │  │
│  │                          │                                     │  │
│  │  ┌───────────────────────┴────────────────────────────────┐   │  │
│  │  │                    Proxy Handler                        │   │  │
│  │  │  ┌────────────────────────────────────────────────┐    │   │  │
│  │  │  │              Profile → Servers Map              │    │   │  │
│  │  │  └────────────────────────────────────────────────┘    │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                          │                                     │  │
│  │  ┌───────────────────────┴────────────────────────────────┐   │  │
│  │  │                   MCP Server Factory                    │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │  │
│  │  │  │ HTTP MCP │  │ SSE MCP  │  │ Stdio MCP│  │ Custom │  │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                          │                                     │  │
│  │  ┌───────────────────────┴────────────────────────────────┐   │  │
│  │  │                    Database Layer                       │   │  │
│  │  │              (SQLite + Drizzle ORM)                     │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Frontend (React 19)                        │  │
│  │  ┌─────────┐  ┌───────────┐  ┌────────────┐  ┌────────────┐   │  │
│  │  │ Profiles│  │MCP Servers│  │Server Detail│ │ Debug Logs │   │  │
│  │  │  Page   │  │   Page    │  │    Page    │  │    Page    │   │  │
│  │  └─────────┘  └───────────┘  └────────────┘  └────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MCP Servers                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   GitHub    │  │   Linear    │  │  Database   │                  │
│  │     MCP     │  │     MCP     │  │     MCP     │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### Backend Server

Express.js application handling:
- REST API for management
- MCP proxy for tool calls
- OAuth flows
- Debug logging

**Location**: `apps/backend/`

### Frontend Application

React SPA providing:
- Profile management UI
- MCP server configuration
- Debug log viewer
- Authentication UI

**Location**: `apps/frontend/`

### Core Package

Shared business logic:
- `ProxyHandler` - Aggregates MCP servers
- `McpServerFactory` - Creates server instances
- Server abstractions - HTTP, SSE, Stdio, Custom

**Location**: `packages/core/`

### Database Package

Data persistence layer:
- Drizzle ORM schema
- Repository pattern
- SQLite database

**Location**: `packages/database/`

---

## Data Flow

### Tool Call Flow

```
1. Client sends JSON-RPC request to /api/mcp/{profile}
2. Backend finds profile and its servers
3. ProxyHandler routes request to appropriate server
4. Server executes tool
5. Response returned to client
6. Debug log created
```

### Profile Resolution

```
1. Request arrives with profile name/ID
2. Profile looked up in database
3. Server IDs fetched from profile_mcp_servers
4. MCP servers instantiated via factory
5. ProxyHandler created with servers
```

---

## Key Abstractions

### McpServer (Abstract)

Base class for all MCP server types:
- `initialize()` - Setup connection
- `listTools()` - Discover tools
- `callTool()` - Execute tool
- `listResources()` - Discover resources
- `readResource()` - Read resource

### ProxyHandler

Aggregates multiple servers:
- Combines tool lists
- Routes tool calls
- Handles conflicts
- Manages sessions

### McpServerFactory

Creates server instances:
- Determines type from config
- Initializes connections
- Injects authentication

---

## Communication Protocols

### Client ↔ Gateway

- **Transport**: HTTP POST, SSE
- **Protocol**: JSON-RPC 2.0
- **Endpoints**: `/api/mcp/{profile}`

### Gateway ↔ MCP Servers

- **HTTP Servers**: HTTP POST
- **SSE Servers**: GET (SSE) + POST
- **Stdio Servers**: stdin/stdout
- **Protocol**: JSON-RPC 2.0

---

## State Management

### Server-Side State

| Data | Storage | Lifetime |
|------|---------|----------|
| Profiles | SQLite | Persistent |
| Servers | SQLite | Persistent |
| OAuth Tokens | SQLite (encrypted) | Until expiration |
| Debug Logs | SQLite | Persistent |
| Sessions | Memory | Request lifetime |

### Client-Side State

| Data | Storage | Lifetime |
|------|---------|----------|
| UI State | React state | Session |
| Form Data | Local state | Until submit |

---

## See Also

- [Data Flow](./data-flow.md) - Detailed request flows
- [Monorepo Structure](./monorepo-structure.md) - Project organization
- [Security Model](./security-model.md) - Security architecture
