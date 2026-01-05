# API Key Setup

This guide covers configuring API key authentication for MCP servers.

## Overview

API key authentication is simpler than OAuth:
- Single credential
- No user interaction
- Immediate access
- Shared across usage

---

## When to Use API Keys

### Good Use Cases

- Third-party APIs that only support API keys
- Internal services with shared credentials
- Development and testing
- Services without OAuth support

### When OAuth is Better

- Per-user authorization needed
- Token expiration required
- Fine-grained permissions
- User revocation capability

---

## Configuration Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| API Key | Yes | The secret key | `sk-abc123...` |
| Header Name | Yes | HTTP header name | `Authorization` |
| Header Template | No | Value format | `Bearer {key}` |

---

## Configuring via Web UI

### Step 1: Add or Edit Server

1. Go to **MCP Servers**
2. Click **"Add MCP Server"** or **"Edit"** existing

### Step 2: Select API Key

In the authentication section, select **"API Key"**.

### Step 3: Enter API Key Details

**API Key**: Your secret API key
```
sk-proj-abc123def456...
```

**Header Name**: The HTTP header to use
```
Authorization
```

**Header Template** (optional): How to format the value
```
Bearer {key}
```

### Step 4: Save

Click **"Create"** or **"Save"**.

---

## Header Configuration

### Common Patterns

| Service | Header Name | Template |
|---------|-------------|----------|
| Standard Bearer | `Authorization` | `Bearer {key}` |
| API Key header | `X-API-Key` | `{key}` |
| Custom header | `X-Service-Key` | `{key}` |
| Basic Auth | `Authorization` | `Basic {key}` |

### Template Syntax

The `{key}` placeholder is replaced with your API key:

```
Template: "Bearer {key}"
API Key: "abc123"
Result: "Bearer abc123"
```

If no template is provided, the key is used directly:

```
API Key: "abc123"
Result: "abc123"
```

---

## Example Configurations

### OpenAI-style

```json
{
  "apiKeyConfig": {
    "apiKey": "sk-proj-abc123...",
    "headerName": "Authorization",
    "headerValueTemplate": "Bearer {key}"
  }
}
```

### Firecrawl

```json
{
  "apiKeyConfig": {
    "apiKey": "fc-abc123...",
    "headerName": "Authorization",
    "headerValueTemplate": "Bearer {key}"
  }
}
```

### Custom API

```json
{
  "apiKeyConfig": {
    "apiKey": "your-api-key",
    "headerName": "X-API-Key",
    "headerValueTemplate": "{key}"
  }
}
```

---

## Request Flow

When making requests, the gateway:

1. Reads API key from configuration
2. Applies header template
3. Adds header to request
4. Sends request to MCP server

```http
POST /mcp HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer sk-abc123...

{"jsonrpc":"2.0",...}
```

---

## Security Best Practices

### Key Management

1. **Never commit keys** to version control
2. **Use environment variables** in production
3. **Rotate keys regularly** (monthly recommended)
4. **Use separate keys** per environment

### Access Control

1. **Generate minimal-scope keys** when possible
2. **Monitor key usage** for anomalies
3. **Revoke unused keys** promptly
4. **Keep key inventory** documented

### Storage

Keys are stored in the database:
- Consider encrypting sensitive fields
- Set `OAUTH_ENCRYPTION_KEY` for encryption
- Backup database securely

---

## Rotating API Keys

### Step 1: Generate New Key

Generate a new API key in the service's dashboard.

### Step 2: Update Gateway

1. Edit the MCP server
2. Replace old key with new key
3. Save changes

### Step 3: Verify

1. Test a tool call
2. Check Debug Logs for success
3. Confirm new key working

### Step 4: Revoke Old Key

Once confirmed working, revoke the old key in the service's dashboard.

---

## Troubleshooting

### "401 Unauthorized"

- API key is invalid
- Key has been revoked
- Wrong header configuration

**Fix**:
1. Verify key is correct
2. Check header name
3. Verify template format

### "403 Forbidden"

- Key lacks permissions
- IP restrictions
- Rate limiting

**Fix**:
1. Check key permissions
2. Verify allowed IPs
3. Check usage limits

### "Wrong header"

- Header name incorrect
- Template malformed
- Missing `{key}` placeholder

**Fix**:
1. Check API documentation for correct header
2. Verify template includes `{key}`
3. Test with curl

### Testing with curl

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
     https://api.example.com/mcp
```

---

## Environment Variables

For sensitive deployments, consider using environment variables:

```bash
# .env
FIRECRAWL_API_KEY=fc-abc123...
```

Then reference in your deployment configuration.

---

## See Also

- [OAuth Setup](./oauth-setup.md) - OAuth authentication
- [Troubleshooting Auth](./troubleshooting-auth.md) - Common issues
- [MCP Servers](../mcp-servers/README.md) - Server configuration
