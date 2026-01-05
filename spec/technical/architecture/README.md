# Architecture Documentation

Technical documentation for Local MCP Gateway architecture.

## Overview

Local MCP Gateway is designed as a modular, extensible system that aggregates multiple MCP servers behind a unified API. The architecture prioritizes:

- **Flexibility** - Support for multiple server types and protocols
- **Reliability** - Graceful error handling and connection management
- **Security** - OAuth 2.1, PKCE, and encrypted credential storage
- **Observability** - Comprehensive logging and debugging

---

## Documentation Index

### System Architecture

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | High-level architecture and components |
| [Data Flow](./data-flow.md) | Request/response flow diagrams |
| [Monorepo Structure](./monorepo-structure.md) | Package organization |
| [Security Model](./security-model.md) | Security architecture |

---

## Architecture Principles

### 1. Profile-Centric Design

Everything revolves around profiles:
- Profiles aggregate MCP servers
- Each profile has a unique endpoint
- Tools are namespaced per server within profile

### 2. Protocol Abstraction

The `McpServer` abstraction hides transport details:
- Remote HTTP servers
- Remote SSE servers
- Local stdio processes
- Custom TypeScript modules

### 3. Stateless Gateway

The gateway is stateless except for:
- Database (profiles, servers, tokens)
- Active connections (managed in memory)
- Debug log buffer (circular, in-memory)

### 4. Security by Default

- OAuth credentials encrypted at rest
- PKCE enabled for all OAuth flows
- No credential exposure in logs
- CORS protection

---

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Profiles    │  │  MCP Servers  │  │  Debug Logs   │       │
│  │     Page      │  │     Page      │  │     Page      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Express Server                         │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │  │
│  │  │ Profile │  │  MCP    │  │  OAuth  │  │   Proxy     │  │  │
│  │  │ Routes  │  │ Routes  │  │ Routes  │  │   Routes    │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      CORE Package                          │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐ │  │
│  │  │ ProxyHandler │  │ McpServer     │  │ OAuthManager   │ │  │
│  │  │              │  │ Abstractions  │  │                │ │  │
│  │  └──────────────┘  └───────────────┘  └────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   DATABASE Package                         │  │
│  │              SQLite + Drizzle ORM                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MCP SERVERS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Remote    │  │   Remote    │  │        Local            │ │
│  │    HTTP     │  │    SSE      │  │   Stdio / Custom        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Abstractions

### ProxyHandler

Central orchestrator that:
- Initializes MCP server connections
- Routes tool calls to appropriate servers
- Aggregates tool lists with namespace prefixes
- Manages connection lifecycle

### McpServer

Base abstraction for all MCP server types:
- `RemoteHttpMcpServer` - HTTP transport
- `RemoteSseMcpServer` - SSE transport
- `ExternalMcpServer` - Stdio processes
- `CustomMcpServer` - In-process TypeScript

### OAuthManager

Handles OAuth flows:
- Token storage and retrieval
- Token refresh
- PKCE generation
- DCR (Dynamic Client Registration)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | Express.js, Node.js 20+ |
| Database | SQLite, Drizzle ORM |
| Build | Turborepo, pnpm |
| Type Safety | TypeScript 5.x |

---

## See Also

- [System Overview](./system-overview.md) - Detailed architecture
- [Data Flow](./data-flow.md) - Request sequences
- [API Reference](../api/README.md) - API documentation
- [Database Schema](../database/schema.md) - Data model
