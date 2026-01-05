# OAuth Setup

This guide covers configuring OAuth 2.1 authentication for MCP servers.

## Overview

OAuth 2.1 provides secure, delegated authorization:
- Users authorize access through the service's UI
- Tokens are managed automatically
- Access can be revoked at any time
- Supports token refresh

---

## Prerequisites

Before configuring OAuth, you need:

1. **OAuth application** registered with the service
2. **Client ID** from the registered app
3. **Client Secret** (if required)
4. **Authorization URL** for the service
5. **Token URL** for the service

---

## Creating an OAuth Application

### GitHub Example

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**
2. Click **"New OAuth App"**
3. Configure:
   - **Application name**: "Local MCP Gateway"
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3001/api/oauth/callback`
4. Click **"Register application"**
5. Note the **Client ID**
6. Generate and note the **Client Secret**

### Google Example

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **OAuth client ID**
3. Select **"Web application"**
4. Configure:
   - **Name**: "Local MCP Gateway"
   - **Authorized redirect URIs**: `http://localhost:3001/api/oauth/callback`
5. Click **"Create"**
6. Note the **Client ID** and **Client Secret**

---

## Configuration Fields

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| Authorization URL | Service's authorize endpoint | `https://github.com/login/oauth/authorize` |
| Token URL | Service's token endpoint | `https://github.com/login/oauth/access_token` |
| Client ID | Your OAuth app's client ID | `Iv1.abc123...` |

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| Client Secret | Your OAuth app's secret | `secret123...` |
| Scopes | Space-separated scopes | `repo read:user` |

---

## Configuring via Web UI

### Step 1: Add or Edit Server

1. Go to **MCP Servers**
2. Click **"Add MCP Server"** or **"Edit"** existing

### Step 2: Select OAuth

In the authentication section, select **"OAuth"**.

### Step 3: Enter OAuth Details

Fill in the fields:

```
Authorization URL: https://github.com/login/oauth/authorize
Token URL: https://github.com/login/oauth/access_token
Client ID: Iv1.abc123def456
Client Secret: your_client_secret_here
Scopes: repo read:user
```

### Step 4: Save

Click **"Create"** or **"Save"**.

### Step 5: Authorize

1. Go to server details
2. Click **"Authorize"**
3. Complete OAuth flow in popup
4. Token is stored automatically

---

## Common OAuth Configurations

### GitHub

```json
{
  "oauthConfig": {
    "authorizationUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "scopes": "repo read:user"
  }
}
```

### Google

```json
{
  "oauthConfig": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "clientId": "your-client-id.apps.googleusercontent.com",
    "clientSecret": "your-client-secret",
    "scopes": "https://www.googleapis.com/auth/calendar"
  }
}
```

### Linear

```json
{
  "oauthConfig": {
    "authorizationUrl": "https://linear.app/oauth/authorize",
    "tokenUrl": "https://api.linear.app/oauth/token",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "scopes": "read write"
  }
}
```

---

## The Authorization Flow

### Step 1: User Initiates

User clicks "Authorize" in gateway UI.

### Step 2: Redirect to Service

Gateway redirects to authorization URL with:
- `client_id`
- `redirect_uri` (callback URL)
- `scope`
- `state` (CSRF protection)
- `code_challenge` (PKCE)

### Step 3: User Authorizes

User logs into service and approves access.

### Step 4: Callback

Service redirects back to gateway with:
- `code` (authorization code)
- `state` (for validation)

### Step 5: Token Exchange

Gateway exchanges code for tokens:
- `access_token`
- `refresh_token` (if available)
- `expires_in`

### Step 6: Storage

Tokens stored encrypted in database.

---

## Token Management

### Token Storage

Tokens are stored in the `oauth_tokens` table:
- Encrypted with `OAUTH_ENCRYPTION_KEY`
- Per-server isolation
- Include expiration time

### Token Refresh

When access token expires:
1. Gateway detects expiration
2. Uses refresh token to get new access token
3. Updates stored tokens
4. Retries request

### Manual Re-authorization

If refresh fails:
1. Token marked as invalid
2. User prompted to re-authorize
3. New tokens obtained

---

## Scopes

### What Are Scopes?

Scopes define what access level the token has:
- `read` - Read-only access
- `write` - Modify data
- `admin` - Administrative actions

### Scope Best Practices

1. **Request minimal scopes** - Only what's needed
2. **Read documentation** - Understand each scope
3. **Review permissions** - Check what's granted
4. **Update if needed** - Re-authorize for more scopes

### Example Scopes

| Service | Common Scopes |
|---------|---------------|
| GitHub | `repo`, `read:user`, `gist` |
| Google | `calendar`, `gmail.readonly`, `drive` |
| Linear | `read`, `write`, `admin` |

---

## HTTPS Requirements

Some OAuth providers require HTTPS for:
- Authorization callback URL
- Production deployments

### Development Options

1. **localtunnel**: `pnpm dev:https`
2. **ngrok**: `ngrok http 3001`
3. **localhost exception**: Some services allow localhost

### Production

Always use HTTPS in production:
- Configure SSL certificates
- Update callback URLs
- Use secure domain

---

## Troubleshooting

### "Invalid redirect_uri"

- Callback URL doesn't match registered URL
- Check trailing slashes
- Verify exact match

### "Invalid client_id"

- Client ID is wrong
- OAuth app deleted
- Wrong environment

### "Access denied"

- User denied authorization
- Insufficient permissions
- Rate limited

### "Token refresh failed"

- Refresh token expired
- Refresh token revoked
- Need re-authorization

### "Invalid scope"

- Scope not supported
- Typo in scope name
- Service changed scopes

See [Troubleshooting Auth](./troubleshooting-auth.md) for more solutions.

---

## See Also

- [OAuth PKCE Flow](./oauth-pkce-flow.md) - PKCE details
- [Dynamic Client Registration](./dynamic-client-registration.md) - Auto registration
- [HTTPS Tunneling](../integration/https-tunneling.md) - HTTPS setup
