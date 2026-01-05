# Quick Start Guide

Get Local MCP Gateway running in 5 minutes.

## Prerequisites

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 9.0.0 (`npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# Install dependencies
pnpm install
```

## Step 2: Start Development Server

```bash
# Start both backend and frontend
pnpm dev
```

This starts:
- **Backend** at `http://localhost:3001`
- **Frontend** at `http://localhost:3000`

Open `http://localhost:3000` in your browser to access the web UI.

## Step 3: Create Your First Profile

1. In the web UI, click **"Create Profile"**
2. Enter a name (e.g., `my-tools`)
3. Add a description (optional)
4. Click **"Create"**

Your profile is now accessible at:
```
http://localhost:3001/api/mcp/my-tools
```

## Step 4: Add an MCP Server

1. Go to **"MCP Servers"** in the navigation
2. Click **"Add MCP Server"**
3. Configure a server:
   - **Name**: `example-server`
   - **Type**: Remote HTTP
   - **URL**: Enter the URL of an MCP server
4. Click **"Create"**

## Step 5: Assign Server to Profile

1. Go back to **"Profiles"**
2. Click **"Edit"** on your profile
3. Check the server you just added
4. Click **"Save"**

## Step 6: Connect Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-tools"
    }
  }
}
```

Restart Claude Desktop. Your tools are now available!

---

## What's Next?

- [Installation Guide](./installation.md) - Detailed setup with options
- [Your First Profile](./first-profile.md) - Profile configuration in depth
- [Adding MCP Servers](./first-mcp-server.md) - Server types and config
- [Use Cases](../use-cases/README.md) - Real-world scenarios

## Quick Reference

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Web UI |
| `http://localhost:3001/api/mcp/{profile}` | Profile endpoint |
| `http://localhost:3001/api/mcp/{profile}/info` | Profile info (tools, resources) |
| `http://localhost:3001/health` | Health check |

## Common Commands

```bash
# Start development
pnpm dev

# Start with HTTPS (for Claude Desktop)
pnpm dev:https

# Build for production
pnpm build

# Run tests
pnpm test

# Reset database
pnpm db:reset
```

---

## Troubleshooting

### Port already in use

```bash
# Find process using port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Database issues

```bash
# Reset the database
pnpm db:reset
```

### Claude Desktop not connecting

1. Make sure the gateway is running (`pnpm dev`)
2. Check the config file path and JSON syntax
3. Restart Claude Desktop completely (quit and reopen)

See [Troubleshooting Guide](../../reference/troubleshooting.md) for more solutions.
