# MCP Servers Page

The MCP Servers page allows you to manage all your MCP server connections.

## Overview

Access at: `http://localhost:3000/mcp-servers`

The page displays:
- All configured MCP servers
- Connection status for each server
- Quick actions for management
- Tool counts

---

## Server Cards

Each server is displayed as a card containing:

### Header Section

- **Server name** - Display name
- **Server type** - HTTP, SSE, Stdio, or Custom
- **Actions** - View Details, Edit, Delete buttons

### Status Section

- **Connection indicator** - Green/Red/Gray dot
- **Status badge** - "Connected", "Error", or "Unknown"
- **Tool count** - Number of available tools

### Configuration Preview

- **URL** - Server endpoint (for remote servers)
- **Auth type** - OAuth, API Key, or None

---

## Adding an MCP Server

### Step 1: Click Add MCP Server

Click the **"Add MCP Server"** button in the top-right corner.

### Step 2: Configure Basic Settings

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Display name for the server |
| Type | Yes | Server type (HTTP, SSE, etc.) |

### Step 3: Configure Type-Specific Settings

#### Remote HTTP

| Field | Required | Description |
|-------|----------|-------------|
| URL | Yes | HTTP endpoint URL |

#### Remote SSE

| Field | Required | Description |
|-------|----------|-------------|
| URL | Yes | SSE endpoint URL |

#### External (Stdio)

| Field | Required | Description |
|-------|----------|-------------|
| Command | Yes | Command to run |
| Arguments | No | Command arguments |
| Working Directory | No | Working directory |

#### Custom (TypeScript)

| Field | Required | Description |
|-------|----------|-------------|
| Module Path | Yes | Path to TypeScript module |

### Step 4: Configure Authentication

Choose authentication method:

#### None

No authentication required.

#### OAuth

| Field | Required | Description |
|-------|----------|-------------|
| Authorization URL | Yes | OAuth authorize endpoint |
| Token URL | Yes | OAuth token endpoint |
| Client ID | Yes | OAuth client ID |
| Client Secret | No | OAuth client secret |
| Scopes | No | Space-separated scopes |

#### API Key

| Field | Required | Description |
|-------|----------|-------------|
| API Key | Yes | The API key value |
| Header Name | Yes | HTTP header name |
| Header Template | No | Value template (e.g., "Bearer {key}") |

### Step 5: Create

Click **"Create"** to save the server.

---

## Viewing Server Details

Click **"View Details"** on a server card to see:

### Configuration Tab

- Full server configuration
- Authentication settings
- Connection parameters

### Tools Tab

- List of all available tools
- Tool descriptions
- Input schemas (expandable)

### Status Tab

- Current connection status
- Error messages (if any)
- Last check time

### Logs Tab

- Recent debug logs for this server
- Request/response payloads
- Timing information

---

## Editing a Server

### Step 1: Click Edit

Click the **"Edit"** button on the server card.

### Step 2: Modify Settings

You can change:
- Name
- URL/configuration
- Authentication settings

Note: **Type cannot be changed** after creation.

### Step 3: Save

Click **"Save"** to apply changes.

---

## Deleting a Server

### Step 1: Click Delete

Click the **"Delete"** button on the server card.

### Step 2: Confirm

A confirmation dialog appears. Click **"Delete"** to confirm.

### What Gets Deleted

- The server configuration
- OAuth tokens for this server
- Server associations with profiles

### What's Preserved

- Profiles (remain without this server)
- Debug logs (server ID becomes null)

---

## Connection Status

### Status Indicators

| Status | Indicator | Meaning |
|--------|-----------|---------|
| Connected | 🟢 Green | Server responding normally |
| Error | 🔴 Red | Connection or auth failure |
| Unknown | ⚪ Gray | Not yet checked |

### Checking Status

Status is checked:
- On page load
- After server creation/edit
- When viewing server details

### Status Not Updating

If status seems stuck:
1. Refresh the page
2. Check server is actually running
3. Verify URL is correct
4. Check authentication credentials

---

## Authentication Management

### OAuth Authorization

For OAuth-configured servers:

1. Go to server details
2. Click **"Authorize"** button
3. Complete OAuth flow in popup
4. Token is stored automatically

### Token Refresh

OAuth tokens are refreshed automatically when:
- Token is expired
- Request returns 401
- Refresh token is available

### API Key Update

To update an API key:
1. Click **"Edit"** on the server
2. Enter new API key
3. Click **"Save"**

---

## Tool Discovery

### How Tools Are Found

When a server is added:
1. Gateway initializes connection
2. Calls `tools/list` on the server
3. Caches discovered tools
4. Displays in UI

### Refreshing Tools

Tools are refreshed:
- On server edit
- When viewing server details
- On gateway restart

### Missing Tools

If expected tools don't appear:
1. Check server is connected
2. Verify tools are enabled on server
3. Check server logs for errors
4. Try reconnecting

---

## Filtering and Sorting

Currently, servers are:
- Sorted by creation date (newest first)
- Filterable by type (dropdown)
- Searchable by name (search box)

---

## Server Types Reference

### Remote HTTP

- Most common type
- Uses HTTP POST for requests
- Supports OAuth and API keys
- Best for cloud-hosted servers

### Remote SSE

- Uses Server-Sent Events
- Better for streaming responses
- Requires compatible server
- Used by some services (Linear, etc.)

### External (Stdio)

- Runs local processes
- Communicates via stdin/stdout
- Best for local tools
- Requires command-line MCP servers

### Custom (TypeScript)

- Dynamic TypeScript modules
- Located in `custom-mcps/` directory
- Hot-reloaded on changes
- Best for custom integrations

---

## Troubleshooting

### "Failed to connect"

1. Verify server URL is correct
2. Check server is running
3. Test URL directly: `curl {url}`
4. Check firewall/network

### "401 Unauthorized"

1. Check OAuth token is valid
2. Verify API key is correct
3. Re-authorize OAuth
4. Check required scopes

### "No tools found"

1. Verify server implements `tools/list`
2. Check server logs
3. Try direct request to server
4. Ensure tools are enabled

### Server keeps disconnecting

1. Check server stability
2. Verify network connection
3. Look for timeout issues
4. Check server logs

---

## See Also

- [Adding MCP Servers](../getting-started/first-mcp-server.md) - Getting started
- [Remote HTTP Servers](../mcp-servers/remote-http.md) - HTTP configuration
- [OAuth Setup](../authentication/oauth-setup.md) - Authentication
- [Server Detail Page](./server-detail-page.md) - Detailed view
