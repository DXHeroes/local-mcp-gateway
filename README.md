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

**For Claude Desktop (HTTPS):**

Start with HTTPS tunnel (using `localtunnel`):

```bash
pnpm dev:https
```

- Backend: http://localhost:3001
- HTTPS Tunnel: Public URL (displayed in console) -> http://localhost:3001
- Frontend: http://localhost:3000 (configured to show the HTTPS tunnel URL)

Use the HTTPS tunnel URL in your `mcp.json` configuration to avoid SSL certificate errors in Claude Desktop.

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

## Integration with Claude Desktop

1.  Run `pnpm dev:https`
2.  Copy the public HTTPS URL from the terminal (e.g., `https://blue-sky-42.loca.lt`)
3.  Configure your `mcp.json`:
    ```json
    "My Profile": {
      "type": "http",
      "url": "https://blue-sky-42.loca.lt/api/mcp/my-profile"
    }
    ```
4.  **AI Prompt**: In the frontend (Profile page), copy the "AI Prompt" (TOON format) and paste it into your chat to give the AI full context about available tools.

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
- ✅ **HTTPS Tunneling** for Claude Desktop
- ✅ **AI Prompt Generation** (TOON format) for easy context sharing
- 🔄 Custom MCP loader (in progress)
- 🔄 Full test coverage (in progress)
- 🔄 Complete documentation (in progress)

## License

MIT
