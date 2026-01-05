# Integration Guides

Connect your AI clients to Local MCP Gateway. This section covers setup for all major MCP-compatible applications.

## Supported Clients

| Client | Status | Guide |
|--------|--------|-------|
| Claude Desktop | Fully Supported | [Setup Guide](./claude-desktop.md) |
| Claude Code CLI | Fully Supported | [Setup Guide](./claude-code.md) |
| Cursor IDE | Fully Supported | [Setup Guide](./cursor-ide.md) |
| Other MCP Clients | Should Work | [Generic Setup](./mcp-json-config.md) |

---

## Prerequisites

Before integrating:

1. **Gateway is running** - Start with `pnpm dev`
2. **Profile exists** - Create at least one profile
3. **Servers configured** - Add MCP servers to your profile

Get your endpoint URL from the profile card:
```
http://localhost:3001/api/mcp/{profile-name}
```

---

## Quick Reference

### Endpoint Format

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:3001/api/mcp/{profile}` | Main MCP endpoint (HTTP) |
| `http://localhost:3001/api/mcp/{profile}/sse` | SSE endpoint |
| `http://localhost:3001/api/mcp/{profile}/info` | Profile metadata |

### Transport Types

Most clients support HTTP transport:

```json
{
  "url": "http://localhost:3001/api/mcp/my-profile"
}
```

Some clients support SSE transport:

```json
{
  "url": "http://localhost:3001/api/mcp/my-profile/sse"
}
```

---

## Guides

### [Claude Desktop](./claude-desktop.md)

Anthropic's official desktop application. Configure via JSON file.

**Key features**:
- Native MCP support
- Multiple server configuration
- Works with localhost

### [Claude Code CLI](./claude-code.md)

Command-line Claude for terminal users.

**Key features**:
- Terminal-based interaction
- Project-specific configuration
- Scripting support

### [Cursor IDE](./cursor-ide.md)

AI-powered code editor with MCP support.

**Key features**:
- IDE integration
- Code-aware context
- Project settings

### [HTTPS Tunneling](./https-tunneling.md)

For clients that require HTTPS or remote access.

**When needed**:
- Some OAuth flows require HTTPS
- Remote access to local gateway
- Cloud-based clients

### [mcp.json Configuration](./mcp-json-config.md)

Generic configuration format used by multiple clients.

**Includes**:
- Complete configuration examples
- Multiple profile setup
- Environment variables

---

## Common Patterns

### Single Profile Setup

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

### Multiple Profiles

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    }
  }
}
```

### With HTTPS (via tunnel)

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "https://my-gateway.loca.lt/api/mcp/my-profile"
    }
  }
}
```

---

## Troubleshooting Integration

### Client can't connect

1. Verify gateway is running (`curl http://localhost:3001/health`)
2. Check URL is correct in client config
3. Restart the client after config changes

### Tools not appearing

1. Verify profile has servers assigned
2. Check servers are connected (green status)
3. Check profile endpoint returns tools: `curl http://localhost:3001/api/mcp/{profile}/info`

### HTTPS required

Some features (OAuth callbacks) require HTTPS:
- Use [HTTPS Tunneling](./https-tunneling.md)
- Or configure local HTTPS certificates

See [Troubleshooting Guide](../../reference/troubleshooting.md) for more help.

---

## Next Steps

Choose your client and follow the guide:

- [Claude Desktop](./claude-desktop.md)
- [Claude Code CLI](./claude-code.md)
- [Cursor IDE](./cursor-ide.md)
