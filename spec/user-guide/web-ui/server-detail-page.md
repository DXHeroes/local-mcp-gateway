# Server Detail Page

The Server Detail page provides in-depth information about a specific MCP server.

## Overview

Access by clicking **"View Details"** on any server card.

URL pattern: `http://localhost:3000/mcp-servers/{server-id}`

---

## Page Sections

### Header

- **Server name** - Display name
- **Server type** - HTTP, SSE, Stdio, or Custom
- **Back button** - Return to MCP Servers list
- **Actions** - Edit, Delete, Authorize (for OAuth)

### Connection Status Card

- **Status indicator** - Green/Red with label
- **Last checked** - When status was last verified
- **Error message** - If connection failed, shows error

### Tools Card

- **Tool count** - Number of discovered tools
- **Tool list** - All tools with details
- **Expand/collapse** - View tool schemas

### Debug Logs Card

- **Recent logs** - Latest requests to this server
- **Filter link** - Go to full debug logs filtered by server

---

## Connection Status

### Status Check

The status card shows:

| Status | Description |
|--------|-------------|
| **Connected** | Server responding, tools available |
| **Error** | Connection failed, error shown |
| **Checking** | Status check in progress |

### Error Messages

When connection fails, you'll see:

- **Network errors**: "Connection refused", "Timeout"
- **Auth errors**: "401 Unauthorized", "403 Forbidden"
- **Server errors**: "500 Internal Server Error"
- **Protocol errors**: "Invalid JSON-RPC response"

### Refresh Status

Click the **refresh** icon to recheck connection status.

---

## Tools List

### Tool Information

Each tool shows:

| Field | Description |
|-------|-------------|
| **Name** | Tool identifier (used in tool calls) |
| **Description** | What the tool does |
| **Input Schema** | Parameters the tool accepts |

### Viewing Tool Schema

1. Find the tool in the list
2. Click the **expand** icon
3. View the JSON Schema for parameters

### Schema Example

```json
{
  "type": "object",
  "properties": {
    "repository": {
      "type": "string",
      "description": "Repository name (owner/repo)"
    },
    "title": {
      "type": "string",
      "description": "Issue title"
    },
    "body": {
      "type": "string",
      "description": "Issue body (markdown)"
    }
  },
  "required": ["repository", "title"]
}
```

### Tool Name Prefixes

If this server's tools have name conflicts with other servers in a profile, they'll be prefixed:

- Original: `search`
- Prefixed: `github:search`

---

## Configuration Display

### Remote HTTP Config

| Field | Description |
|-------|-------------|
| URL | Server endpoint |
| Headers | Custom headers (if any) |

### Remote SSE Config

| Field | Description |
|-------|-------------|
| URL | SSE endpoint |
| POST Endpoint | Request endpoint |

### External (Stdio) Config

| Field | Description |
|-------|-------------|
| Command | Executable to run |
| Arguments | Command arguments |
| Environment | Environment variables |
| Working Directory | Process working directory |

### Custom Config

| Field | Description |
|-------|-------------|
| Module Path | Path to TypeScript module |

---

## Authentication Display

### OAuth Configuration

Shows:
- Authorization URL
- Token URL
- Client ID (secret hidden)
- Scopes
- Token status (valid/expired)

### API Key Configuration

Shows:
- Header name
- Header template
- Key (masked)

### Authorize Button

For OAuth servers without a valid token:

1. Click **"Authorize"**
2. Complete OAuth flow in popup
3. Return to see updated token status

---

## Debug Logs Card

### Recent Activity

Shows the last N requests to this server:

| Field | Description |
|-------|-------------|
| Timestamp | When request was made |
| Type | Request type (tools/call, etc.) |
| Status | Success/Error |
| Duration | Time taken |

### Viewing Details

Click a log entry to see:
- Full request payload
- Full response payload
- Error details (if failed)

### Full Logs

Click **"View All Logs"** to go to Debug Logs page filtered to this server.

---

## Actions

### Edit Server

1. Click **"Edit"** in header
2. Modify configuration
3. Save changes

Note: Type cannot be changed.

### Delete Server

1. Click **"Delete"** in header
2. Confirm deletion

Warning: Removes server from all profiles.

### Re-authorize OAuth

1. Click **"Authorize"** in auth section
2. Complete OAuth flow
3. New token replaces old one

### Refresh Tools

1. Click **"Refresh"** in tools section
2. Gateway re-queries tools from server
3. List updates with latest tools

---

## Troubleshooting

### Status shows "Error"

1. Check the error message displayed
2. Verify server is running
3. Test URL directly
4. Check authentication

### No tools showing

1. Verify server is connected
2. Check server implements tools/list
3. Click refresh to re-fetch
4. Check server-side logs

### OAuth keeps failing

1. Verify OAuth configuration
2. Check redirect URIs match
3. Ensure client credentials are correct
4. Try re-authorizing

### Logs not appearing

1. Make requests through a profile containing this server
2. Check profile is using this server
3. Ensure requests complete (not aborted)

---

## See Also

- [MCP Servers Page](./mcp-servers-page.md) - Server list
- [Debug Logs Page](./debug-logs-page.md) - Full logs
- [OAuth Setup](../authentication/oauth-setup.md) - OAuth details
- [Tool Name Conflicts](../mcp-servers/tool-name-conflicts.md) - Prefixing
