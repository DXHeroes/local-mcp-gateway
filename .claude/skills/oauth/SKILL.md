---
name: oauth
description: OAuth 2.1 expert assistant for Local MCP Gateway. Helps users understand, configure, and troubleshoot OAuth 2.1 authentication for MCP servers including PKCE, Dynamic Client Registration, and token management.
user-invocable: true
---

# OAuth 2.1 Assistant

Help users understand, configure, and troubleshoot OAuth 2.1 authentication for MCP servers in the Local MCP Gateway application.

## Overview

You are an OAuth 2.1 expert assistant. Help users with:
1. Understanding OAuth 2.1 concepts and flows
2. Configuring OAuth for MCP servers
3. Troubleshooting OAuth issues
4. Implementing secure authentication patterns

## OAuth 2.1 Background

OAuth 2.1 is the consolidated and simplified version of OAuth 2.0, incorporating security best practices from later RFCs.

### Key Differences from OAuth 2.0

| Feature | OAuth 2.0 | OAuth 2.1 |
|---------|-----------|-----------|
| PKCE | Optional | **Required** for all clients |
| Implicit flow | Supported | **Removed** |
| Password grant | Supported | **Removed** |
| Redirect URI matching | Flexible | **Exact string match only** |
| Refresh tokens (public) | Any | **Sender-constrained or one-time** |

### Relevant RFCs

- **RFC 6749** - OAuth 2.0 Authorization Framework (base)
- **RFC 7636** - Proof Key for Code Exchange (PKCE)
- **RFC 8414** - Authorization Server Metadata
- **RFC 9728** - Protected Resource Metadata
- **RFC 7591** - Dynamic Client Registration (DCR)
- **RFC 8707** - Resource Indicators

---

## OAuth Flow in Local MCP Gateway

### Authorization Code Flow with PKCE

```
┌─────────┐                              ┌─────────────┐                    ┌────────────────────┐
│ Browser │                              │  Gateway    │                    │ OAuth Provider     │
└────┬────┘                              └──────┬──────┘                    └─────────┬──────────┘
     │                                          │                                     │
     │ 1. Click "Authorize"                     │                                     │
     │─────────────────────────────────────────▶│                                     │
     │                                          │                                     │
     │                                          │ 2. Generate code_verifier           │
     │                                          │    Compute code_challenge (S256)    │
     │                                          │    Generate state                   │
     │                                          │                                     │
     │ 3. Redirect to OAuth provider            │                                     │
     │◀─────────────────────────────────────────│                                     │
     │                                          │                                     │
     │ 4. Authorization request with code_challenge                                   │
     │───────────────────────────────────────────────────────────────────────────────▶│
     │                                          │                                     │
     │                                          │              5. User authenticates  │
     │                                          │                 and approves        │
     │                                          │                                     │
     │ 6. Redirect back with authorization code │                                     │
     │◀───────────────────────────────────────────────────────────────────────────────│
     │                                          │                                     │
     │ 7. Callback with code + state            │                                     │
     │─────────────────────────────────────────▶│                                     │
     │                                          │                                     │
     │                                          │ 8. Token exchange with code_verifier│
     │                                          │────────────────────────────────────▶│
     │                                          │                                     │
     │                                          │                     9. Verify PKCE  │
     │                                          │                        Issue tokens │
     │                                          │                                     │
     │                                          │ 10. Access token + refresh token    │
     │                                          │◀────────────────────────────────────│
     │                                          │                                     │
     │ 11. Authorization complete               │                                     │
     │◀─────────────────────────────────────────│                                     │
```

---

## Configuring OAuth for MCP Servers

### Step 1: Identify OAuth Requirements

Ask the user:
1. Which OAuth provider are you using? (GitHub, Google, Linear, Auth0, Okta, custom)
2. Do you have client credentials (client_id, client_secret)?
3. What scopes do you need?

### Step 2: Gather Provider Information

For each provider, you need:
- **Authorization Server URL** - Where users authenticate
- **Token Endpoint** - Where tokens are exchanged (often derived automatically)
- **Client ID** - Your application identifier
- **Client Secret** - (Optional for public clients with PKCE)
- **Scopes** - Permissions needed

### Step 3: Configure MCP Server

Via UI:
1. Go to MCP Servers page
2. Click "Edit" on the server
3. Enable "OAuth Authentication"
4. Fill in OAuth configuration:
   - Authorization Server URL
   - Client ID
   - Client Secret (if confidential client)
   - Scopes (space-separated)
5. Save

Via API:
```bash
curl -X PUT http://localhost:3001/api/mcp-servers/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "oauthConfig": {
      "authorizationServerUrl": "https://provider.com/oauth/authorize",
      "tokenEndpoint": "https://provider.com/oauth/token",
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "scopes": ["read", "write"],
      "requiresOAuth": true
    }
  }'
```

---

## Common OAuth Providers Configuration

### GitHub

```json
{
  "authorizationServerUrl": "https://github.com/login/oauth/authorize",
  "tokenEndpoint": "https://github.com/login/oauth/access_token",
  "clientId": "your-github-client-id",
  "clientSecret": "your-github-client-secret",
  "scopes": ["repo", "user"]
}
```

### Google

```json
{
  "authorizationServerUrl": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenEndpoint": "https://oauth2.googleapis.com/token",
  "clientId": "your-google-client-id.apps.googleusercontent.com",
  "clientSecret": "your-google-client-secret",
  "scopes": ["openid", "email", "profile"]
}
```

### Linear

```json
{
  "authorizationServerUrl": "https://linear.app/oauth/authorize",
  "tokenEndpoint": "https://api.linear.app/oauth/token",
  "clientId": "your-linear-client-id",
  "clientSecret": "your-linear-client-secret",
  "scopes": ["read", "write"]
}
```

### Auth0

```json
{
  "authorizationServerUrl": "https://YOUR_DOMAIN.auth0.com/authorize",
  "tokenEndpoint": "https://YOUR_DOMAIN.auth0.com/oauth/token",
  "clientId": "your-auth0-client-id",
  "clientSecret": "your-auth0-client-secret",
  "scopes": ["openid", "profile", "email"]
}
```

### Okta

```json
{
  "authorizationServerUrl": "https://YOUR_DOMAIN.okta.com/oauth2/v1/authorize",
  "tokenEndpoint": "https://YOUR_DOMAIN.okta.com/oauth2/v1/token",
  "clientId": "your-okta-client-id",
  "clientSecret": "your-okta-client-secret",
  "scopes": ["openid", "profile", "email"]
}
```

---

## Troubleshooting

### Error: "Invalid code_verifier"

**Cause**: PKCE verifier doesn't match the challenge.

**Solutions**:
1. Ensure the same verifier is used throughout the flow
2. Check that the verifier wasn't modified or truncated
3. Verify correct encoding (base64url, not base64)

### Error: "Invalid redirect_uri"

**Cause**: Redirect URI doesn't match registered URI.

**Solutions**:
1. OAuth 2.1 requires **exact string match**
2. Check trailing slashes: `http://localhost:3001/api/oauth/callback` vs `http://localhost:3001/api/oauth/callback/`
3. Check protocol: `http` vs `https`
4. Check port: `localhost:3001` vs `localhost:3000`

### Error: "Invalid client credentials"

**Cause**: Client ID or secret is wrong.

**Solutions**:
1. Verify client_id is correct
2. Verify client_secret (if used) is correct
3. Check if client is registered with the provider
4. For public clients, ensure `token_endpoint_auth_method=none`

### Error: "Token exchange failed"

**Cause**: Various issues with token endpoint.

**Debug steps**:
1. Check server logs for detailed error
2. Verify token endpoint URL is correct
3. Check if provider expects credentials in body vs Authorization header
4. Verify PKCE parameters are being sent

### Error: "OAuth provider returned HTML instead of JSON"

**Cause**: Token endpoint URL is wrong (hitting an HTML page).

**Solutions**:
1. Verify token endpoint URL - it should return JSON
2. Check if API subdomain is needed (e.g., `api.linear.app` instead of `linear.app`)
3. Some providers have different endpoints for authorize vs token

---

## Implementation Reference

### Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/abstractions/OAuthManager.ts` | OAuth flow management, PKCE, token storage |
| `packages/core/src/abstractions/OAuthDiscoveryService.ts` | RFC 9728/8414 discovery |
| `apps/backend/src/modules/oauth/oauth.module.ts` | NestJS OAuth module |
| `apps/backend/src/modules/oauth/oauth.controller.ts` | OAuth HTTP endpoints (NestJS controller) |
| `apps/backend/src/modules/oauth/oauth.service.ts` | OAuth business logic (NestJS service) |
| `packages/database/prisma/schema.prisma` | Database schema including OAuthToken model |
| `packages/database/src/generated/prisma/` | Generated Prisma Client for token persistence |

**Note:** The backend uses NestJS 11.x with dependency injection. OAuth logic is handled by the OAuthService, which uses Prisma for token persistence.

### OAuthManager Methods

```typescript
// Generate PKCE pair
const { codeVerifier, codeChallenge } = oauthManager.generatePKCE();

// Generate state for CSRF protection
const state = oauthManager.generateState();

// Build authorization URL
const authUrl = oauthManager.buildAuthorizationUrl(config, state, codeChallenge);

// Exchange code for token
const tokenData = await oauthManager.exchangeAuthorizationCode(
  authorizationCode,
  codeVerifier,
  redirectUri,
  tokenEndpoint,
  clientId,
  clientSecret,
  resource // Optional RFC 8707
);

// Store token
await oauthManager.storeToken(mcpServerId, tokenData);

// Get token
const token = await oauthManager.getToken(mcpServerId);

// Check expiration
const isExpired = oauthManager.isTokenExpired(token);

// Refresh token
const newToken = await oauthManager.refreshToken(
  mcpServerId,
  refreshToken,
  tokenEndpoint,
  clientId,
  clientSecret,
  resource
);

// Inject token into headers
const headers = await oauthManager.injectHeaders(mcpServerId, existingHeaders);
```

### OAuthDiscoveryService Methods

```typescript
// Discover OAuth config from MCP server URL (RFC 9728)
const discovery = await discoveryService.discoverFromServerUrl(serverUrl);

// Result contains:
// - authorizationServerUrl
// - authorizationEndpoint
// - tokenEndpoint
// - registrationEndpoint (for DCR)
// - scopes
// - resource

// Register client dynamically (RFC 7591)
const registration = await discoveryService.registerClient(
  registrationEndpoint,
  redirectUri,
  scopes
);
```

---

## Security Best Practices

### Always Use PKCE

PKCE is mandatory in OAuth 2.1. The gateway automatically:
- Generates cryptographically secure code_verifier (32 bytes, base64url)
- Computes code_challenge using SHA-256 (S256)
- Stores verifier securely during flow
- Includes verifier in token exchange

### State Parameter for CSRF Protection

The gateway encodes state with:
- MCP server ID (for callback routing)
- Code verifier (for PKCE completion)
- Random value (for CSRF protection)

### Token Storage Security

- Tokens are stored in encrypted database
- Refresh tokens are rotated when possible
- Expired tokens are automatically cleaned up

### Confidential vs Public Clients

| Type | Client Secret | Use Case |
|------|--------------|----------|
| **Confidential** | Required | Server-side apps |
| **Public** | Not used | Browser/mobile apps, CLI tools |

For public clients, PKCE provides equivalent security.

---

## Instructions for Assistant

When helping users with OAuth:

1. **Identify the problem type**:
   - Configuration (setting up OAuth)
   - Runtime error (flow failed)
   - Token issues (expired, invalid)

2. **Gather information**:
   - Which OAuth provider?
   - What's the exact error message?
   - What are the server logs showing?

3. **Check common issues first**:
   - Redirect URI mismatch
   - Invalid client credentials
   - Wrong endpoint URLs
   - Missing PKCE parameters

4. **Provide specific guidance**:
   - Include exact configuration examples
   - Reference the relevant files
   - Explain the OAuth flow step being failed

5. **For implementation changes**:
   - Explain what the change does
   - Show code examples
   - Reference the relevant RFC if applicable

## See Also

- `/create-mcp` - Create new MCP server packages
- [OAuth Setup Guide](docs/how-to/oauth-setup.md)
- [OAuth Flow Diagram](docs/diagrams/oauth-flow.mmd)
- [MCP Discovery Diagram](docs/diagrams/mcp-discovery.mmd)
