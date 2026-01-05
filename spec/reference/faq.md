# Frequently Asked Questions

Common questions about Local MCP Gateway.

---

## General

### What is Local MCP Gateway?

Local MCP Gateway is an aggregator for MCP (Model Context Protocol) servers. It allows you to combine multiple MCP servers into "profiles" and access them through a single endpoint, rather than configuring each server individually in every AI client.

### Why would I use this instead of configuring servers directly?

Benefits include:
- **Single configuration point** - Configure once, use in all clients
- **Profile-based organization** - Group tools by use-case
- **Centralized authentication** - Manage OAuth/API keys in one place
- **Debug visibility** - See all MCP traffic in one place
- **Tool aggregation** - Access multiple servers' tools together

### What MCP clients are supported?

Any MCP-compatible client works, including:
- Claude Desktop
- Claude Code CLI
- Cursor IDE
- Other MCP clients

### Is this an official Anthropic product?

No, this is an independent open-source project.

---

## Setup & Installation

### What are the system requirements?

- Node.js 20+
- pnpm 9+
- ~500MB disk space
- Any modern OS (macOS, Linux, Windows)

### Where is data stored?

Database is stored at:
- `~/.local-mcp-gateway-data/local-mcp-gateway.db`

### Can I run this in production?

Yes, with considerations:
- Use HTTPS
- Configure proper security
- Use Docker for deployment
- Set up monitoring

See [Deployment Guide](../technical/deployment/README.md).

### How do I reset the database?

```bash
pnpm db:reset
```

This deletes and recreates the database with default data.

---

## Profiles

### Can I rename a profile?

No, profile names cannot be changed after creation. You must create a new profile with the desired name and delete the old one.

### What characters are allowed in profile names?

- Lowercase letters (a-z)
- Uppercase letters (A-Z)
- Numbers (0-9)
- Dashes (-)
- Underscores (_)

No spaces or special characters.

### Can a server be in multiple profiles?

Yes, servers can be assigned to multiple profiles. Authentication (OAuth tokens, API keys) is shared across profiles.

### What happens when I delete a profile?

- Profile is removed
- Server associations are removed
- Debug logs for that profile are deleted
- Servers themselves remain (can be used in other profiles)

---

## MCP Servers

### What server types are supported?

- **Remote HTTP** - HTTP POST JSON-RPC servers
- **Remote SSE** - Server-Sent Events servers
- **External Stdio** - Local command-line servers
- **Custom TypeScript** - Custom modules

### How do I know if a server is connected?

Check the status indicator:
- 🟢 Green = Connected
- 🔴 Red = Error
- ⚪ Gray = Unknown

### What if two servers have the same tool name?

Tools from later servers get prefixed with their server ID:
- First server: `search`
- Second server: `serverb:search`

### Can I use a localhost server?

Yes, localhost servers work without issues. No HTTPS required for local servers.

---

## Authentication

### Do I need OAuth for all servers?

No. Choose based on the server:
- **None** - Public/local servers
- **OAuth** - Services supporting OAuth (GitHub, etc.)
- **API Key** - Services requiring API keys

### Where are OAuth tokens stored?

Encrypted in the SQLite database. Set `OAUTH_ENCRYPTION_KEY` environment variable for encryption.

### How do I refresh an expired token?

1. Go to MCP Servers page
2. View server details
3. Click "Authorize" to re-authenticate

The gateway also attempts automatic refresh using refresh tokens.

### Can multiple users share OAuth tokens?

Tokens are per-server, not per-user. In a shared deployment, all users share the same tokens for a server.

---

## Integration

### Why isn't Claude Desktop seeing my tools?

1. Verify gateway is running
2. Check config file syntax
3. Restart Claude Desktop completely
4. Verify profile has servers assigned

### Do I need HTTPS?

For local development, HTTP is fine. HTTPS is needed for:
- OAuth with some providers
- Production deployments
- Remote access

### Can I use multiple profiles in Claude Desktop?

Yes, configure multiple servers:

```json
{
  "mcpServers": {
    "dev": { "url": "http://localhost:3001/api/mcp/dev" },
    "personal": { "url": "http://localhost:3001/api/mcp/personal" }
  }
}
```

---

## Debugging

### Where can I see what's happening?

The Debug Logs page shows all MCP traffic:
- Request payloads
- Response payloads
- Errors
- Timing

### Why is a tool call failing?

Check Debug Logs for:
- Error messages
- HTTP status codes
- Response payloads

Common causes:
- Authentication expired
- Server unreachable
- Invalid parameters

### How do I test if the gateway is working?

```bash
# Health check
curl http://localhost:3001/health

# List tools
curl -X POST http://localhost:3001/api/mcp/my-profile \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Performance

### How many servers can I add?

No hard limit, but consider:
- More servers = longer initialization
- More tools = larger tool list
- Keep profiles focused

### Are tools cached?

Yes, tool lists are cached after initialization. They refresh on:
- Server reconnection
- Gateway restart

### What about rate limiting?

The gateway has rate limiting for protection. MCP proxy endpoints have higher limits than management APIs.

---

## Security

### Is my data secure?

- Data stored locally in SQLite
- OAuth tokens can be encrypted
- No data sent to external services (except MCP servers)

### Should I expose this to the internet?

Not recommended without:
- HTTPS
- Authentication (future feature)
- Firewall rules
- Monitoring

### How do I secure API keys?

- Use `OAUTH_ENCRYPTION_KEY` for encryption
- Don't commit keys to version control
- Rotate keys regularly

---

## Troubleshooting

### The gateway won't start

1. Check Node.js version (`node --version` should be 20+)
2. Check pnpm is installed
3. Run `pnpm install`
4. Check for port conflicts

### Tools aren't appearing

1. Check servers are connected
2. Verify servers have tools
3. Check profile has servers assigned
4. View server details for errors

### OAuth authorization fails

1. Check redirect URI matches exactly
2. Verify client ID/secret
3. Check OAuth app still exists
4. Try HTTPS if required

See [Troubleshooting Guide](./troubleshooting.md) for more.

---

## See Also

- [Glossary](./glossary.md) - Term definitions
- [Troubleshooting](./troubleshooting.md) - Problem solutions
- [Error Codes](./error-codes.md) - Error reference
