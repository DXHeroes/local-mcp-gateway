# Technical Documentation

This section provides technical details for developers working with or extending Local MCP Gateway.

## Sections

### [Architecture](./architecture/README.md)

System design and component relationships.

- [System Overview](./architecture/system-overview.md) - High-level architecture
- [Data Flow](./architecture/data-flow.md) - Request/response flows
- [Monorepo Structure](./architecture/monorepo-structure.md) - Project organization
- [Security Model](./architecture/security-model.md) - Security architecture

### [API Reference](./api/README.md)

Complete API documentation.

- [REST API](./api/rest-api.md) - All endpoints
- [Profiles API](./api/profiles-api.md) - Profile management
- [MCP Servers API](./api/mcp-servers-api.md) - Server management
- [Proxy API](./api/proxy-api.md) - MCP proxy endpoints
- [JSON-RPC Protocol](./api/json-rpc-protocol.md) - MCP protocol

### [Database](./database/README.md)

Database schema and data layer.

- [Schema](./database/schema.md) - Complete schema reference
- [Tables](./database/tables/) - Individual table docs
- [Migrations](./database/migrations.md) - Migration strategy

### [Core Package](./core/README.md)

Core abstractions and business logic.

- [Abstractions](./core/abstractions/) - Class documentation
- [Factories](./core/factories.md) - Factory patterns
- [Types](./core/types.md) - TypeScript types

### [Configuration](./configuration/README.md)

Configuration reference.

- [Environment Variables](./configuration/environment-variables.md)
- [Rate Limiting](./configuration/rate-limiting.md)

### [Deployment](./deployment/README.md)

Deployment guides.

- [Docker](./deployment/docker.md)
- [Production Checklist](./deployment/production-checklist.md)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.9 |
| **Backend** | Express.js |
| **Frontend** | React 19, Vite |
| **Database** | SQLite, Drizzle ORM |
| **Build** | Turborepo, pnpm |
| **Testing** | Vitest, Playwright |
| **Linting** | Biome |

---

## Quick Reference

### Start Development

```bash
pnpm install
pnpm dev
```

### Run Tests

```bash
pnpm test
```

### Build for Production

```bash
pnpm build
```

### Database Location

```
~/.local-mcp-gateway-data/local-mcp-gateway.db
```

---

## See Also

- [User Guide](../user-guide/README.md) - User documentation
- [Reference](../reference/README.md) - Quick reference
- [Contributing](../contributing/README.md) - Contributor guide
