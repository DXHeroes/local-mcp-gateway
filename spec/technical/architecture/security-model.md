# Security Model

Security architecture and considerations for Local MCP Gateway.

## Overview

Local MCP Gateway implements multiple security layers to protect credentials, data, and communications.

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSPORT SECURITY                            │
│              HTTPS, CORS, Rate Limiting                          │
├─────────────────────────────────────────────────────────────────┤
│                    AUTHENTICATION                                │
│              OAuth 2.1, PKCE, API Keys                          │
├─────────────────────────────────────────────────────────────────┤
│                    AUTHORIZATION                                 │
│              Profile-based, Scope-based                          │
├─────────────────────────────────────────────────────────────────┤
│                    DATA PROTECTION                               │
│              Encryption at Rest, Secret Handling                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Transport Security

### HTTPS Support

For production deployments:
- HTTPS termination at reverse proxy (recommended)
- Direct HTTPS via tunneling for development

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

### Rate Limiting

Protects against abuse:
- Default: 100 requests per minute per IP
- Configurable via environment variables
- Separate limits for different endpoints

---

## Authentication

### OAuth 2.1 with PKCE

All OAuth flows use PKCE (Proof Key for Code Exchange):

| Component | Purpose |
|-----------|---------|
| `code_verifier` | Random secret, never transmitted to auth server |
| `code_challenge` | SHA-256 hash of verifier |
| `state` | CSRF protection |

**Flow security:**
1. Verifier generated client-side
2. Only challenge sent in authorization request
3. Verifier required for token exchange
4. Prevents authorization code interception

### API Key Authentication

For MCP servers requiring API keys:
- Keys stored encrypted in database
- Keys injected into requests at runtime
- Never exposed in logs or responses

### Token Storage

OAuth tokens are encrypted at rest:

```typescript
// Encryption
const encrypted = encrypt(JSON.stringify(tokens), ENCRYPTION_KEY);
await db.insert(oauthTokens).values({
  serverId,
  encryptedTokens: encrypted
});

// Decryption
const encrypted = await db.query.oauthTokens.findFirst(...);
const tokens = JSON.parse(decrypt(encrypted, ENCRYPTION_KEY));
```

---

## Authorization

### Profile-Based Access

Each profile has a unique slug-based endpoint:
- `/mcp/:slug` - Profile endpoint
- Access controlled by profile existence
- No cross-profile data leakage

### Scope-Based Access

OAuth scopes control MCP server access:
- Scopes defined per server configuration
- Requested during authorization
- Enforced by authorization server

---

## Credential Management

### Secret Types

| Secret | Storage | Protection |
|--------|---------|------------|
| OAuth tokens | Database | AES-256 encryption |
| API keys | Database | AES-256 encryption |
| Client secrets | Database | AES-256 encryption |
| Encryption key | Environment | Not stored in DB |

### Encryption Implementation

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return iv.toString('hex') + tag.toString('hex') + encrypted;
}

export function decrypt(encrypted: string, key: string): string {
  const iv = Buffer.from(encrypted.slice(0, IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(
    encrypted.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2),
    'hex'
  );
  const content = encrypted.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    iv
  );
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Encryption Key Requirements

```bash
# Generate secure key (32 bytes = 64 hex characters)
openssl rand -hex 32

# Set in environment
export OAUTH_ENCRYPTION_KEY=your-64-character-hex-key
```

---

## Input Validation

### Request Validation

All API inputs validated:
- JSON schema validation for request bodies
- Parameter type checking
- Length limits enforced

### SQL Injection Prevention

Using Drizzle ORM with parameterized queries:

```typescript
// Safe - parameterized
const profile = await db.query.profiles.findFirst({
  where: eq(profiles.slug, slug)
});

// Never do string concatenation
// const profile = db.execute(`SELECT * FROM profiles WHERE slug = '${slug}'`);
```

### XSS Prevention

- React escapes output by default
- Content-Type headers enforced
- No `dangerouslySetInnerHTML` usage

---

## Logging Security

### Sensitive Data Handling

Credentials never logged:

```typescript
// Log redaction
function redactSensitive(obj: any): any {
  const sensitive = ['password', 'secret', 'token', 'key', 'authorization'];
  const result = { ...obj };

  for (const key of Object.keys(result)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      result[key] = '[REDACTED]';
    }
  }

  return result;
}

logger.info('Request', redactSensitive(request));
```

### Debug Log Filtering

Debug logs filter sensitive headers:

```typescript
const filteredHeaders = {
  ...headers,
  authorization: headers.authorization ? '[REDACTED]' : undefined,
  'x-api-key': headers['x-api-key'] ? '[REDACTED]' : undefined
};
```

---

## Process Isolation

### External Stdio Servers

Stdio servers run as child processes:
- Inherit gateway's user permissions
- Can access user's filesystem
- Should only run trusted executables

**Recommendations:**
- Restrict allowed paths
- Validate command configuration
- Use principle of least privilege

### Custom TypeScript Modules

Run in-process with gateway:
- Full access to Node.js APIs
- Can affect gateway stability
- Only load trusted modules

---

## Security Checklist

### Development

- [ ] Use HTTPS for OAuth callbacks
- [ ] Set strong encryption key
- [ ] Don't commit `.env` files
- [ ] Use environment variables for secrets

### Production

- [ ] Enable HTTPS termination
- [ ] Configure strict CORS
- [ ] Set rate limiting
- [ ] Rotate encryption keys periodically
- [ ] Monitor for suspicious activity
- [ ] Regular security updates

---

## Known Limitations

### Local Development

- HTTP used by default (HTTPS via tunnel)
- CORS typically permissive
- Rate limiting may be disabled

### Single-User Design

Currently designed for single-user:
- No multi-tenant isolation
- No user authentication at gateway level
- All profiles accessible to gateway user

---

## Security Best Practices

### For Users

1. **Use strong encryption key** - Generate with `openssl rand -hex 32`
2. **Protect database file** - Contains encrypted credentials
3. **Review MCP servers** - Only add trusted servers
4. **Use OAuth when possible** - More secure than API keys
5. **Regular updates** - Keep gateway updated

### For Developers

1. **Never log credentials** - Use redaction utilities
2. **Validate all input** - Use schema validation
3. **Use parameterized queries** - Drizzle handles this
4. **Keep dependencies updated** - Security patches
5. **Follow secure coding practices** - OWASP guidelines

---

## Incident Response

### Compromised Encryption Key

1. Generate new encryption key
2. Re-authorize all OAuth connections
3. Re-enter all API keys
4. Review access logs

### Compromised OAuth Token

1. Revoke token at provider
2. Re-authorize connection
3. Review activity

### Database Breach

1. Consider all credentials compromised
2. Rotate all OAuth authorizations
3. Change all API keys
4. Generate new encryption key

---

## See Also

- [OAuth Setup](../../user-guide/authentication/oauth-setup.md) - OAuth configuration
- [OAuth PKCE Flow](../../user-guide/authentication/oauth-pkce-flow.md) - PKCE details
- [Environment Variables](../configuration/environment-variables.md) - Configuration
