# Adding Your First MCP Server

MCP servers provide the actual tools and resources that AI can use. This guide walks through adding your first server.

## Understanding Server Types

Local MCP Gateway supports four server types:

| Type | Description | Use Case |
|------|-------------|----------|
| **Remote HTTP** | HTTP POST JSON-RPC | Cloud-hosted MCP servers |
| **Remote SSE** | Server-Sent Events | Streaming responses |
| **External Stdio** | Local process (stdin/stdout) | Local CLI tools |
| **Custom TypeScript** | Dynamic TypeScript modules | Custom integrations |

For your first server, we recommend **Remote HTTP** as it's the simplest.

---

## Adding a Remote HTTP Server

### Step 1: Navigate to MCP Servers

1. Click **"MCP Servers"** in the navigation
2. Click **"Add MCP Server"**

### Step 2: Configure Basic Settings

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Display name for the server | `GitHub` |
| **Type** | Server type | `Remote HTTP` |
| **URL** | The MCP server endpoint | `https://api.example.com/mcp` |

### Step 3: Configure Authentication (If Required)

If the server requires authentication, choose one:

#### No Authentication

For public or local servers that don't require auth.

#### OAuth 2.1

For servers using OAuth (GitHub, Linear, etc.):

| Field | Description |
|-------|-------------|
| **Authorization URL** | OAuth authorize endpoint |
| **Token URL** | OAuth token endpoint |
| **Client ID** | Your OAuth client ID |
| **Client Secret** | Your OAuth client secret (if required) |
| **Scopes** | Space-separated scopes |

#### API Key

For servers using simple API keys:

| Field | Description |
|-------|-------------|
| **API Key** | Your API key |
| **Header Name** | HTTP header name (e.g., `Authorization`) |
| **Header Template** | Value format (e.g., `Bearer {key}`) |

### Step 4: Save

Click **"Create"** to add the server.

---

## Verifying Connection

After adding a server:

1. Look for the **status indicator** on the server card:
   - **Green** = Connected
   - **Red** = Error
   - **Gray** = Unknown

2. Click **"View Details"** to see:
   - Available tools
   - Connection status
   - Error messages (if any)

---

## Adding a Server to a Profile

Servers aren't automatically available to AI. You must assign them to a profile:

1. Go to **"Profiles"**
2. Click **"Edit"** on your profile
3. Check the server you added
4. Click **"Save"**

The server's tools are now available through the profile endpoint.

---

## Example: Adding a Mock Server

For testing, you can use a simple mock server:

1. **Name**: `test-server`
2. **Type**: Remote HTTP
3. **URL**: `https://httpbin.org/post` (echo server)
4. **Auth**: None

This won't provide real MCP tools but demonstrates the configuration flow.

---

## Example: Adding Firecrawl (SSE)

Firecrawl uses SSE transport:

1. **Name**: `Firecrawl`
2. **Type**: Remote SSE
3. **URL**: `https://api.firecrawl.dev/v1/mcp`
4. **Auth**: API Key
   - Key: Your Firecrawl API key
   - Header: `Authorization`
   - Template: `Bearer {key}`

---

## Server Configuration Reference

### Remote HTTP Configuration

```json
{
  "type": "remote_http",
  "url": "https://api.example.com/mcp",
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

### Remote SSE Configuration

```json
{
  "type": "remote_sse",
  "url": "https://api.example.com/mcp/sse",
  "sseEndpoint": "/sse",
  "postEndpoint": "/message"
}
```

### OAuth Configuration

```json
{
  "authorizationUrl": "https://auth.example.com/authorize",
  "tokenUrl": "https://auth.example.com/token",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "scopes": "read write"
}
```

### API Key Configuration

```json
{
  "apiKey": "your-api-key",
  "headerName": "Authorization",
  "headerValueTemplate": "Bearer {key}"
}
```

---

## Managing Servers

### Edit a Server

1. Click **"Edit"** on the server card
2. Modify settings
3. Click **"Save"**

Note: Server type cannot be changed after creation.

### Delete a Server

1. Click **"Delete"** on the server card
2. Confirm deletion

**Warning**: Deleting a server removes it from all profiles.

### View Server Details

1. Click **"View Details"** on the server card
2. See:
   - Full configuration
   - Available tools with schemas
   - Connection status
   - Recent debug logs

---

## Tool Discovery

When you add a server, the gateway:

1. Initializes the connection
2. Calls `tools/list` to discover available tools
3. Caches tool definitions
4. Shows tools in the server detail page

To refresh tools after server changes:
1. Go to server details
2. Click **"Refresh Tools"**

---

## Troubleshooting

### Server shows "Disconnected"

1. **Check the URL** - Is it correct and accessible?
2. **Check authentication** - Are credentials valid?
3. **Check the server** - Is the MCP server running?
4. **View details** - Check error messages

### "Connection refused"

The server is not accessible. Possible causes:
- Server is not running
- Firewall blocking connection
- Wrong URL or port

### "401 Unauthorized"

Authentication failed. Check:
- OAuth token hasn't expired
- API key is correct
- Credentials have required permissions

### "Tool not found"

The tool exists on the server but wasn't discovered:
1. Refresh tools in server details
2. Check server logs for errors
3. Verify tool is enabled on the server

### SSE Connection Drops

SSE connections can timeout. The gateway handles reconnection automatically, but if issues persist:
1. Check server timeout settings
2. Verify network stability
3. Consider using HTTP transport if SSE is unstable

---

## Next Steps

- [Server Types in Detail](../mcp-servers/README.md) - Deep dive into each type
- [OAuth Setup](../authentication/oauth-setup.md) - Configure OAuth
- [Profile Management](../profiles/README.md) - Organize servers into profiles
- [Debug Logs](../web-ui/debug-logs-page.md) - Monitor MCP traffic
