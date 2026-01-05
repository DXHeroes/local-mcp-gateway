# Authentication

This section covers authentication configuration for MCP servers in Local MCP Gateway.

## Authentication Methods

The gateway supports three authentication methods:

| Method | Security | Complexity | Use Case |
|--------|----------|------------|----------|
| **None** | Low | Simple | Local/public servers |
| **OAuth 2.1** | High | Complex | Production services |
| **API Key** | Medium | Simple | Third-party APIs |

---

## Quick Comparison

| Feature | None | OAuth | API Key |
|---------|------|-------|---------|
| Security level | Low | High | Medium |
| User interaction | No | Yes (authorize) | No |
| Token refresh | N/A | Automatic | N/A |
| Per-user tokens | No | Yes | No (shared) |
| Setup complexity | None | High | Low |

---

## Choosing an Authentication Method

### Use None When

- Server is local (localhost)
- Server is on private network
- Server has no sensitive data
- Testing/development only

### Use OAuth When

- Service supports OAuth (GitHub, Google, etc.)
- Per-user authorization needed
- Access tokens should expire
- Production deployment

### Use API Key When

- Service requires API key
- Shared credential acceptable
- Simpler than OAuth
- No per-user isolation needed

---

## Guides

### [OAuth Setup](./oauth-setup.md)

Complete guide to configuring OAuth 2.1 authentication.

- Creating OAuth apps
- Configuration fields
- Authorization flow
- Token management

### [OAuth PKCE Flow](./oauth-pkce-flow.md)

Technical explanation of the PKCE extension.

- Why PKCE matters
- How it works
- Security benefits

### [Dynamic Client Registration](./dynamic-client-registration.md)

Automatic OAuth client registration (RFC 7591).

- When to use DCR
- Auto-discovery
- Configuration

### [API Key Setup](./api-key-setup.md)

Guide to configuring API key authentication.

- Header configuration
- Value templates
- Best practices

### [Troubleshooting Auth](./troubleshooting-auth.md)

Common authentication issues and solutions.

- Error diagnosis
- Token problems
- Configuration fixes

---

## Authentication Flow

### OAuth Flow

```
User                Gateway              MCP Server        OAuth Provider
  │                    │                     │                   │
  │─── Configure ─────▶│                     │                   │
  │                    │                     │                   │
  │◀── Need Auth ──────│                     │                   │
  │                    │                     │                   │
  │─── Authorize ─────▶│────────────────────────── Auth URL ────▶│
  │                    │                     │                   │
  │◀────────────────────────────────────────────── Callback ─────│
  │                    │                     │                   │
  │                    │─── Token Exchange ─────────────────────▶│
  │                    │◀── Access Token ────────────────────────│
  │                    │                     │                   │
  │─── Use Tools ─────▶│─── Request ────────▶│                   │
  │                    │   (with token)      │                   │
  │◀── Response ───────│◀── Response ────────│                   │
```

### API Key Flow

```
User                Gateway              MCP Server
  │                    │                     │
  │─── Configure ─────▶│                     │
  │   (with API key)   │                     │
  │                    │                     │
  │─── Use Tools ─────▶│─── Request ────────▶│
  │                    │  (key in header)    │
  │◀── Response ───────│◀── Response ────────│
```

---

## Security Considerations

### OAuth Tokens

- Stored encrypted in database
- Encryption key via `OAUTH_ENCRYPTION_KEY`
- Tokens refreshed automatically
- Per-server token isolation

### API Keys

- Stored in database
- Not encrypted (configure encryption key for better security)
- Shared across all profile usage
- Consider rotation schedule

### Best Practices

1. Use HTTPS for OAuth callbacks
2. Use minimal OAuth scopes
3. Rotate API keys periodically
4. Monitor for auth errors
5. Use separate credentials per environment

---

## Environment Configuration

### OAUTH_ENCRYPTION_KEY

Required for OAuth token encryption:

```bash
OAUTH_ENCRYPTION_KEY=your-32-character-minimum-secret-key
```

Generate a secure key:

```bash
openssl rand -hex 32
```

---

## See Also

- [OAuth Setup](./oauth-setup.md) - OAuth configuration
- [API Key Setup](./api-key-setup.md) - API key configuration
- [MCP Servers](../mcp-servers/README.md) - Server configuration
