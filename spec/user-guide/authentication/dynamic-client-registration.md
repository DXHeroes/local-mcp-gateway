# Dynamic Client Registration

Dynamic Client Registration (DCR) allows OAuth clients to register with authorization servers automatically, without manual setup.

## What is DCR?

DCR is defined in RFC 7591 and allows:
- Automatic client registration
- No manual OAuth app creation
- Self-service client credentials
- Programmatic client management

---

## How DCR Works

### Traditional OAuth Setup

1. Developer creates OAuth app in provider dashboard
2. Copies client_id and client_secret
3. Configures in application
4. Updates when credentials change

### With DCR

1. Application sends registration request
2. Server returns client credentials
3. Application stores and uses credentials
4. Automatic credential management

---

## DCR Flow

### Step 1: Discovery

Gateway discovers registration endpoint:

```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: auth.example.com
```

Response includes:
```json
{
  "registration_endpoint": "https://auth.example.com/register",
  "token_endpoint": "https://auth.example.com/token",
  "authorization_endpoint": "https://auth.example.com/authorize"
}
```

### Step 2: Registration Request

```http
POST /register HTTP/1.1
Host: auth.example.com
Content-Type: application/json

{
  "client_name": "Local MCP Gateway",
  "redirect_uris": ["http://localhost:3001/api/oauth/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

### Step 3: Registration Response

```json
{
  "client_id": "auto-generated-client-id",
  "client_secret": "auto-generated-secret",
  "client_id_issued_at": 1234567890,
  "client_secret_expires_at": 0,
  "registration_access_token": "token-for-management",
  "registration_client_uri": "https://auth.example.com/register/client-id"
}
```

### Step 4: Use Credentials

Gateway stores and uses the credentials for OAuth flows.

---

## DCR in Local MCP Gateway

### Automatic Discovery

The gateway automatically:
1. Checks for DCR support via OAuth metadata
2. Registers if DCR is available
3. Falls back to manual config if not

### When DCR is Used

DCR is attempted when:
- Server URL provided
- No client_id configured
- Server supports DCR

### Storage

DCR credentials stored in `oauth_client_registrations` table:
- Per MCP server
- Per authorization server
- Includes management tokens

---

## Configuration

### With DCR (Minimal Config)

```json
{
  "oauthConfig": {
    "authorizationUrl": "https://auth.example.com/authorize",
    "tokenUrl": "https://auth.example.com/token",
    "scopes": "read write"
  }
}
```

Gateway discovers and registers automatically.

### Without DCR (Manual Config)

```json
{
  "oauthConfig": {
    "authorizationUrl": "https://auth.example.com/authorize",
    "tokenUrl": "https://auth.example.com/token",
    "clientId": "manual-client-id",
    "clientSecret": "manual-secret",
    "scopes": "read write"
  }
}
```

---

## MCP OAuth Discovery

MCP extends OAuth discovery for resource servers (MCP servers).

### Protected Resource Metadata

MCP servers can advertise OAuth requirements:

```http
GET /.well-known/oauth-protected-resource HTTP/1.1
Host: mcp.example.com
```

Response:
```json
{
  "resource": "https://mcp.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["mcp:read", "mcp:write"]
}
```

### Flow with MCP Discovery

1. Gateway connects to MCP server
2. Server returns 401 with `WWW-Authenticate`
3. Gateway fetches protected resource metadata
4. Discovers authorization server
5. Performs DCR if supported
6. Completes OAuth flow

---

## Server Support

### Servers with DCR Support

- Auth0 ✓
- Okta ✓
- Keycloak ✓
- Some enterprise OAuth servers

### Servers without DCR

- GitHub (manual app registration)
- Google (manual setup required)
- Linear (API key or manual OAuth)

---

## Registration Parameters

### Standard Parameters

| Parameter | Description |
|-----------|-------------|
| client_name | Display name |
| redirect_uris | Allowed callbacks |
| grant_types | Supported grants |
| response_types | Supported responses |
| scope | Requested scopes |
| token_endpoint_auth_method | Auth method |

### Common Values

```json
{
  "client_name": "Local MCP Gateway",
  "redirect_uris": ["http://localhost:3001/api/oauth/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_post"
}
```

---

## Client Management

### Registration Access Token

DCR provides a `registration_access_token` for:
- Reading client configuration
- Updating client settings
- Deleting client

### Update Client

```http
PUT /register/client-id HTTP/1.1
Host: auth.example.com
Authorization: Bearer registration-access-token
Content-Type: application/json

{
  "redirect_uris": ["http://localhost:3001/api/oauth/callback", "https://new-url"]
}
```

### Delete Client

```http
DELETE /register/client-id HTTP/1.1
Host: auth.example.com
Authorization: Bearer registration-access-token
```

---

## Troubleshooting

### "Registration endpoint not found"

**Cause**: Server doesn't support DCR.

**Solution**: Manually configure OAuth app:
1. Create app in provider dashboard
2. Get client_id and client_secret
3. Configure in gateway

### "Registration failed"

**Cause**: Server rejected registration request.

**Solutions**:
1. Check required parameters
2. Verify redirect URI format
3. Check server requirements

### "Invalid redirect_uri"

**Cause**: Callback URL not allowed.

**Solution**: Some servers require pre-approved domains. Use manual registration.

---

## Security Considerations

### Credential Storage

- Store credentials securely (encrypted)
- Protect registration access tokens
- Don't expose in logs

### Rotation

- DCR credentials may expire
- Handle credential refresh
- Re-register if needed

### Trust

- Only register with trusted servers
- Validate server certificates
- Use HTTPS

---

## See Also

- [OAuth Setup](./oauth-setup.md) - OAuth configuration
- [OAuth PKCE Flow](./oauth-pkce-flow.md) - PKCE security
- [Troubleshooting Auth](./troubleshooting-auth.md) - Common issues
