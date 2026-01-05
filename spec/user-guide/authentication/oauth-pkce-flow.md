# OAuth PKCE Flow

PKCE (Proof Key for Code Exchange) is a security extension to OAuth 2.0 that prevents authorization code interception attacks.

## What is PKCE?

PKCE (pronounced "pixie") adds an extra layer of security to the OAuth authorization code flow. It ensures that the same client that started the authorization flow is the one that completes it.

---

## Why PKCE Matters

### The Problem

Without PKCE, the authorization code flow has a vulnerability:

1. User clicks "Authorize"
2. Browser redirects to OAuth provider
3. User logs in and approves
4. OAuth provider redirects back with `code` in URL
5. **Attack vector**: Malicious app could intercept this code
6. Attacker exchanges code for access token

### The Solution

PKCE adds a cryptographic proof:

1. Client generates random `code_verifier`
2. Client creates `code_challenge` = hash of `code_verifier`
3. Authorization request includes `code_challenge`
4. Token exchange must include original `code_verifier`
5. Server verifies: hash(`code_verifier`) == `code_challenge`

An attacker who intercepts the code can't exchange it without the `code_verifier`.

---

## How PKCE Works

### Step 1: Generate Code Verifier

Client generates a cryptographically random string:

```javascript
// 43-128 characters, URL-safe
const codeVerifier = generateRandomString(64);
// Example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### Step 2: Create Code Challenge

Hash the verifier using SHA-256:

```javascript
const codeChallenge = base64UrlEncode(sha256(codeVerifier));
// Example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

### Step 3: Authorization Request

Include challenge in authorization URL:

```
https://auth.example.com/authorize?
  client_id=CLIENT_ID&
  redirect_uri=http://localhost:3001/api/oauth/callback&
  response_type=code&
  scope=read%20write&
  state=random_state_value&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

### Step 4: User Authorizes

User logs in and approves access. Provider redirects back:

```
http://localhost:3001/api/oauth/callback?
  code=AUTH_CODE&
  state=random_state_value
```

### Step 5: Token Exchange

Exchange code for tokens, including the verifier:

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE&
redirect_uri=http://localhost:3001/api/oauth/callback&
client_id=CLIENT_ID&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### Step 6: Server Verification

OAuth server:
1. Takes the `code_verifier`
2. Computes SHA-256 hash
3. Compares with stored `code_challenge`
4. If match, issues tokens

---

## PKCE in Local MCP Gateway

### Automatic Handling

The gateway handles PKCE automatically:

1. Generates secure `code_verifier` for each authorization
2. Computes `code_challenge` using S256 method
3. Stores verifier securely during flow
4. Includes verifier in token exchange
5. Cleans up after completion

### Configuration

No configuration needed. PKCE is used automatically when available.

### Server Support

Most modern OAuth providers support PKCE:
- GitHub ✓
- Google ✓
- Microsoft ✓
- Linear ✓
- Auth0 ✓
- Okta ✓

---

## Technical Details

### Code Verifier Requirements

| Requirement | Value |
|-------------|-------|
| Length | 43-128 characters |
| Characters | A-Z, a-z, 0-9, -, ., _, ~ |
| Entropy | Cryptographically random |

### Code Challenge Methods

| Method | Description | Security |
|--------|-------------|----------|
| `S256` | SHA-256 hash (recommended) | High |
| `plain` | No transformation | Low (not recommended) |

The gateway always uses `S256`.

### S256 Calculation

```javascript
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(verifier);
  const digest = hash.digest();
  return base64UrlEncode(digest);
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

---

## Security Benefits

### Attack Prevention

| Attack | Without PKCE | With PKCE |
|--------|--------------|-----------|
| Code interception | Vulnerable | Protected |
| Cross-site request forgery | Partial (state) | Full (state + PKCE) |
| Malicious app on device | Vulnerable | Protected |
| Man-in-the-middle | Vulnerable | Protected |

### Why S256 Over Plain

- `plain` method provides no cryptographic protection
- `S256` ensures verifier can't be derived from challenge
- Always use `S256` in production

---

## Troubleshooting

### "Invalid code_verifier"

**Cause**: Verifier doesn't match challenge.

**Solutions**:
1. Ensure same verifier used for exchange
2. Check verifier wasn't modified
3. Verify correct encoding (base64url)

### "code_challenge required"

**Cause**: Server requires PKCE but challenge missing.

**Solution**: Gateway handles this automatically. If error persists:
1. Check OAuth provider supports PKCE
2. Verify gateway version is current

### "Unsupported code_challenge_method"

**Cause**: Server doesn't support S256.

**Solution**: Most servers support S256. If not:
1. Check server documentation
2. Consider using different provider

---

## Flow Diagram

```
Client                     Gateway                    OAuth Provider
  │                          │                              │
  │── Authorize request ────▶│                              │
  │                          │                              │
  │                          │── Generate code_verifier ────│
  │                          │── Compute code_challenge ────│
  │                          │── Store verifier ────────────│
  │                          │                              │
  │                          │── Redirect with challenge ──▶│
  │                          │                              │
  │                          │          User logs in and approves
  │                          │                              │
  │                          │◀── Redirect with code ───────│
  │                          │                              │
  │                          │── Token request + verifier ─▶│
  │                          │                              │
  │                          │     Server verifies:         │
  │                          │     hash(verifier) == challenge
  │                          │                              │
  │                          │◀── Access token ─────────────│
  │                          │                              │
  │◀── Authorization done ───│                              │
```

---

## See Also

- [OAuth Setup](./oauth-setup.md) - OAuth configuration
- [Dynamic Client Registration](./dynamic-client-registration.md) - DCR
- [Troubleshooting Auth](./troubleshooting-auth.md) - Auth issues
