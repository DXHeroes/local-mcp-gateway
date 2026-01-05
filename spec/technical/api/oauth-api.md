# OAuth API

REST API for OAuth operations.

## Overview

The OAuth API handles authorization flows for MCP servers that require OAuth authentication.

---

## Endpoints

### Start OAuth Flow

```http
GET /api/oauth/start/:serverId
```

Initiates the OAuth authorization flow for a server.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| serverId | string | Server UUID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| redirect | string | URL to redirect after completion |

**Response:** 302 Redirect to authorization URL

**Flow:**
1. Gateway generates PKCE code verifier and challenge
2. Generates random state parameter
3. Stores verifier and state in session
4. Redirects to authorization server

**Example redirect URL:**
```
https://github.com/login/oauth/authorize?
  client_id=xxx&
  redirect_uri=http://localhost:3001/api/oauth/callback&
  response_type=code&
  scope=repo%20user&
  state=random_state&
  code_challenge=xxx&
  code_challenge_method=S256
```

---

### OAuth Callback

```http
GET /api/oauth/callback
```

Handles the OAuth callback from authorization server.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Authorization code |
| state | string | State parameter |
| error | string | Error code (if failed) |
| error_description | string | Error description |

**Success Response:** 302 Redirect to success page or original redirect

**Flow:**
1. Validates state parameter
2. Exchanges code for tokens using PKCE verifier
3. Stores encrypted tokens in database
4. Redirects to success page

---

### Check OAuth Status

```http
GET /api/oauth/status/:serverId
```

Checks if server has valid OAuth tokens.

**Response:**
```json
{
  "hasToken": true,
  "isValid": true,
  "expiresAt": "2024-01-01T00:00:00Z",
  "scopes": ["repo", "user"]
}
```

**Response (no token):**
```json
{
  "hasToken": false,
  "isValid": false,
  "authorizationUrl": "/api/oauth/start/server-uuid"
}
```

---

### Revoke OAuth Tokens

```http
DELETE /api/oauth/tokens/:serverId
```

Deletes stored OAuth tokens for a server.

**Response:**
```json
{
  "success": true
}
```

**Note:** This only removes local tokens. To fully revoke access, user should also revoke in the provider's settings.

---

### Refresh Token

```http
POST /api/oauth/refresh/:serverId
```

Manually triggers token refresh.

**Response:**
```json
{
  "success": true,
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | NO_REFRESH_TOKEN | No refresh token available |
| 401 | REFRESH_FAILED | Token refresh failed |

---

## Dynamic Client Registration

### Check DCR Status

```http
GET /api/oauth/dcr/status/:serverId
```

Checks if server supports DCR.

**Response:**
```json
{
  "supported": true,
  "registrationEndpoint": "https://auth.example.com/register",
  "isRegistered": true
}
```

---

### Trigger DCR

```http
POST /api/oauth/dcr/register/:serverId
```

Manually triggers Dynamic Client Registration.

**Response:**
```json
{
  "success": true,
  "clientId": "auto-generated-id"
}
```

---

## Token Management

### Token Storage

Tokens stored in `oauth_tokens` table:

```json
{
  "serverId": "uuid",
  "encryptedTokens": "aes-256-encrypted-data",
  "expiresAt": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Token Structure (decrypted)

```json
{
  "access_token": "xxx",
  "refresh_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "repo user"
}
```

---

## Error Handling

### OAuth Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATE | State mismatch (CSRF) |
| 400 | MISSING_CODE | No authorization code |
| 401 | TOKEN_EXCHANGE_FAILED | Failed to exchange code |
| 404 | SERVER_NOT_FOUND | Server doesn't exist |
| 409 | NO_OAUTH_CONFIG | Server has no OAuth config |

### Provider Errors

OAuth providers may return errors:

| Error | Description |
|-------|-------------|
| access_denied | User denied authorization |
| invalid_request | Invalid request |
| unauthorized_client | Client not authorized |
| unsupported_response_type | Response type not supported |
| invalid_scope | Invalid scope |
| server_error | Provider server error |

---

## Security

### PKCE

All OAuth flows use PKCE:
- S256 challenge method
- 64-character random verifier
- Verifier stored server-side

### State Parameter

- Random 32-character string
- Stored in session
- Validated on callback
- Prevents CSRF attacks

### Token Encryption

Tokens encrypted with AES-256-GCM:
```
OAUTH_ENCRYPTION_KEY=<64-character-hex-key>
```

---

## See Also

- [OAuth Setup](../../user-guide/authentication/oauth-setup.md) - User guide
- [OAuth PKCE Flow](../../user-guide/authentication/oauth-pkce-flow.md) - PKCE details
- [Dynamic Client Registration](../../user-guide/authentication/dynamic-client-registration.md) - DCR
