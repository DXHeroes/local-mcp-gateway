# Quick Start Guide

## Option 1: Docker (Recommended)

The fastest way to get started - no installation required:

```bash
# Download and start
curl -fsSL https://raw.githubusercontent.com/DXHeroes/local-mcp-gateway/main/docker-compose.hub.yml -o local-mcp-gateway.yml && docker compose -f local-mcp-gateway.yml up -d
```

- **UI**: http://localhost:9630
- **MCP Endpoint**: http://localhost:9631/api/mcp/default

To stop: `docker compose down`

For detailed Docker documentation, see [Docker Quick Start](../how-to/docker-quickstart.md).

---

## Option 2: From Source

If you want to develop or customize the gateway:

### Installation

```bash
# Install dependencies
pnpm install

# Initialize database
pnpm db:seed
```

## Running the Application

### Development Mode

Start both backend and frontend with hot-reload:

```bash
pnpm dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

**Secure HTTPS Mode (Recommended for Claude Desktop):**

```bash
pnpm dev:https
```

This starts a secure public tunnel (via `localtunnel`) to your local backend. Use the displayed `https://....loca.lt` URL in your MCP clients.

### Production Mode

```bash
# Build everything
pnpm build

# Start backend
pnpm --filter backend start

# Start frontend (in another terminal)
pnpm --filter frontend preview
```

## Sign up

After starting the application, open the UI and create your account:

1. Navigate to the UI (http://localhost:3000 for source, http://localhost:9630 for Docker)
2. Click **Sign up** and enter your name, email, and password
3. Optionally, sign in with Google if your instance has Google OAuth configured

A personal workspace (organization) is created automatically when you sign up.

## Creating your first profile

1. Open http://localhost:3000 in your browser
2. Sign up with your email and password (or use Google sign-in if configured)
3. You'll land in your personal workspace — an organization is automatically created for you
4. Click "Create Profile"
5. Enter a profile name (e.g., "my-profile")
6. Optionally add a description
7. Click "Create"

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

### 1. Configure Endpoint

Add your profile's MCP endpoint to your AI tool (Claude Desktop).

**Standard (Local):**
```
http://localhost:3001/api/mcp/my-profile
```

**HTTPS (Tunnel - Required for some tools):**
1. Run `pnpm dev:https`
2. Copy the public URL (e.g. `https://blue-sky.loca.lt`)
3. Use: `https://blue-sky.loca.lt/api/mcp/my-profile`

### 2. Provide AI Context (Prompt)

To help the AI understand what tools are available:

1.  Go to the Profile detail page in the frontend.
2.  Click **"AI Prompt"** to expand the section.
3.  Click **"Copy"** to get a TOON-formatted prompt containing all available tools and their schemas.
4.  Paste this into your AI chat (Cursor Chat, Claude).

This ensures the AI knows exactly which tools it can call and how.
