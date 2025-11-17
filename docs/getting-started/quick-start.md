# Quick Start Guide

## Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Running the Application

### Development Mode

Start both backend and frontend with hot-reload:

```bash
pnpm dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Production Mode

```bash
# Build everything
pnpm build

# Start backend
pnpm --filter backend start

# Start frontend (in another terminal)
pnpm --filter frontend preview
```

## Creating Your First Profile

1. Open http://localhost:3000 in your browser
2. Click "Create Profile"
3. Enter a profile name (e.g., "my-profile")
4. Optionally add a description
5. Click "Create"

Your profile will have its own MCP endpoint:
- HTTP: `http://localhost:3001/api/mcp/my-profile`
- SSE: `http://localhost:3001/api/mcp/my-profile/sse`
- Info: `http://localhost:3001/api/mcp/my-profile/info`

## Adding MCP Servers

1. Go to "MCP Servers" page
2. Click "Add MCP Server"
3. Choose server type:
   - **Remote HTTP**: For HTTP-based MCP servers
   - **Remote SSE**: For Server-Sent Events MCP servers
   - **Custom**: For custom TypeScript MCP implementations
   - **External**: For external MCP processes

4. Configure authentication:
   - **OAuth 2.1**: Click "Authorize" to start OAuth flow
   - **API Key**: Enter your API key and header configuration

5. Add the server to a profile

## Using Profiles in AI Tools

Add your profile's MCP endpoint to your AI tool (e.g., Cursor, Claude Desktop):

```
http://localhost:3001/api/mcp/my-profile
```

The AI tool will be able to use all tools and resources from MCP servers in that profile.

