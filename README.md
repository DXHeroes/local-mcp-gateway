# Local MCP Proxy Server

A local proxy server for MCP (Model Context Protocol) servers that allows you to:
- Add external MCP servers as proxies
- Create custom MCP implementations
- Manage profiles (named sets of MCP servers)
- Handle OAuth 2.1 flows for MCP servers
- Manage API keys for MCP servers

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Development

Start both backend and frontend with hot-reload:

```bash
pnpm dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Building

```bash
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## Project Structure

```
local_mcp_ui/
├── packages/          # Shared packages
│   ├── core/         # Core abstractions
│   ├── database/     # Database layer
│   └── custom-mcp-loader/  # Custom MCP loader
├── apps/              # Applications
│   ├── backend/      # Express.js backend
│   └── frontend/     # React 19 frontend
├── custom-mcps/       # User-created custom MCPs
└── docs/             # Documentation
```

## Features

- ✅ Profile management
- ✅ MCP server management
- ✅ OAuth 2.1 support (PKCE, DCR)
- ✅ API key management
- ✅ MCP proxy endpoints per profile
- ✅ Debug logging
- 🔄 Custom MCP loader (in progress)
- 🔄 Full test coverage (in progress)
- 🔄 Complete documentation (in progress)

## License

MIT

