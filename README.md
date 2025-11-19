# Local MCP Gateway

A **Local MCP Gateway** for MCP (Model Context Protocol) servers that allows you to:

-   **Aggregate multiple MCP servers** into a single endpoint
-   **Create custom MCP servers** using TypeScript
-   **Manage servers via a Web UI**
-   **Inspect MCP traffic** with built-in debug logs
-   **Secure your servers** with API keys and OAuth 2.1

![Local MCP Gateway Dashboard](docs/images/dashboard-preview.png)

## Features

-   🚀 **Proxy & Aggregator**: Combine multiple MCP servers (stdio, SSE, remote) into one
-   🛠️ **Custom MCP Support**: Write your own MCP servers in TypeScript with hot-reload
-   🔒 **Security**: Built-in API Key management and OAuth 2.1 support
-   📊 **Observability**: Real-time request/response logging and inspection
-   🖥️ **Web Interface**: Modern UI to manage servers, profiles, and logs
-   🐳 **Docker Ready**: Easy deployment with Docker Compose

## Quick Start

### Prerequisites

-   Node.js 20+
-   pnpm 9+
-   Docker (optional, for containerized deployment)

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

## Production Usage

### Running Locally (Bare Metal)

To run the production build locally:

```bash
pnpm start
```

This will:
1. Build the application.
2. Start the backend on http://localhost:3001.
3. Start the frontend on http://localhost:3000.

**Data Persistence:**
Data is stored in `~/.local-mcp-gateway-data` (your home directory) to ensure it persists across restarts and updates.

### Running with Docker

To run using Docker (recommended for long-term use):

```bash
pnpm docker:up
# or
docker-compose up -d
```

This provides:
- **Frontend**: http://localhost (Port 80) and https://localhost (Port 443)
- **Backend**: http://localhost:3001
- **Data Persistence**: Volumes mapped to `~/.local-mcp-gateway-data`.
- **HTTPS**: Self-signed certificates are automatically generated in `~/.local-mcp-gateway-data/certs`.

**Note on HTTPS**:
Since self-signed certificates are used, you will need to accept the security warning in your browser or configure your system to trust `localhost.crt`.

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
local_mcp_gateway/
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
