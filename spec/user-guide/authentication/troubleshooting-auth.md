# Troubleshooting Authentication

Common authentication issues and their solutions.

## Quick Diagnosis

### Check Connection Status

1. Go to **MCP Servers** page
2. Look at status indicator
3. **Red** = Authentication or connection issue

### View Error Details

1. Click **"View Details"** on the server
2. Check error message in status section
3. Review Debug Logs for specific errors

---

## OAuth Issues

### "Invalid client_id"

**Cause**: OAuth client ID is incorrect or doesn't exist.

**Solutions**:
1. Verify client ID in OAuth provider dashboard
2. Check for copy/paste errors (extra spaces)
3. Ensure OAuth app wasn't deleted
4. Confirm correct environment (dev vs prod)

### "Invalid redirect_uri"

**Cause**: Callback URL doesn't match registered URL.

**Solutions**:
1. Check registered callback URL in OAuth app settings
2. Ensure exact match including:
   - Protocol (`http` vs `https`)
   - Port number
   - Path (`/api/oauth/callback`)
   - Trailing slash
3. Update OAuth app if gateway URL changed

**Gateway callback URL**:
```
http://localhost:3001/api/oauth/callback
```

### "Access denied"

**Cause**: User denied authorization or lacks permissions.

**Solutions**:
1. Try authorizing again
2. Check user has access to requested resources
3. Verify scopes are appropriate
4. Check if organization approval is required

### "Token expired"

**Cause**: Access token expired and refresh failed.

**Solutions**:
1. Click **"Authorize"** to get new token
2. Check refresh token wasn't revoked
3. Verify OAuth app still exists
4. Check service's token lifetime settings

### "Invalid scope"

**Cause**: Requested scope not supported or misspelled.

**Solutions**:
1. Check service's documentation for valid scopes
2. Remove unsupported scopes
3. Check for typos
4. Use space-separated list

### "PKCE verification failed"

**Cause**: Code challenge/verifier mismatch.

**Solutions**:
1. Try authorization again
2. Check for browser issues (cookies, storage)
3. Ensure single authorization flow at a time
4. Clear browser cache

### "State mismatch"

**Cause**: CSRF protection triggered.

**Solutions**:
1. Don't reuse authorization URLs
2. Complete flow in one browser session
3. Check for URL manipulation

---

## API Key Issues

### "401 Unauthorized"

**Cause**: API key is invalid or missing.

**Solutions**:
1. Verify API key is correct
2. Check key wasn't revoked
3. Confirm header name is correct
4. Verify header template format

**Test with curl**:
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
     https://api.example.com/mcp/health
```

### "403 Forbidden"

**Cause**: Key lacks required permissions.

**Solutions**:
1. Check key's permission level
2. Generate key with correct scopes
3. Verify IP allowlist (if applicable)
4. Check rate limits

### "Invalid header"

**Cause**: Wrong header name or format.

**Solutions**:
1. Check API documentation for correct header
2. Common headers:
   - `Authorization: Bearer {key}`
   - `X-API-Key: {key}`
   - `Api-Key: {key}`
3. Verify template includes `{key}`

### "Rate limited"

**Cause**: Too many requests with this key.

**Solutions**:
1. Wait for rate limit reset
2. Implement request caching
3. Upgrade API plan if needed
4. Spread requests over time

---

## Connection Issues

### "Connection refused"

**Cause**: Cannot reach the server.

**Solutions**:
1. Verify server URL is correct
2. Check server is running
3. Verify network connectivity
4. Check firewall rules

### "SSL/TLS error"

**Cause**: Certificate issues.

**Solutions**:
1. Use HTTPS for production
2. Check certificate validity
3. For local dev, use HTTP or valid certs
4. Check system clock (certificate validation)

### "Timeout"

**Cause**: Server too slow or unreachable.

**Solutions**:
1. Check server health
2. Verify network latency
3. Increase timeout if possible
4. Check for server-side issues

---

## Token Storage Issues

### "OAUTH_ENCRYPTION_KEY not set"

**Cause**: Missing encryption key environment variable.

**Solution**:
```bash
# Generate key
openssl rand -hex 32

# Add to .env
OAUTH_ENCRYPTION_KEY=your-generated-key-here
```

### "Decryption failed"

**Cause**: Encryption key changed after tokens were stored.

**Solutions**:
1. Don't change encryption key in production
2. If changed, users must re-authorize
3. Backup old key before changing

### "Token not found"

**Cause**: Token was never stored or was deleted.

**Solutions**:
1. Re-authorize the server
2. Check database integrity
3. Verify server ID is correct

---

## Service-Specific Issues

### GitHub

**"Resource not accessible"**:
- Check repository permissions
- Verify organization access approved
- Request needed scopes

**"API rate limit exceeded"**:
- Wait for reset (usually 1 hour)
- Use authenticated requests
- Cache responses

### Google

**"Access blocked: Authorization Error"**:
- App not verified (for sensitive scopes)
- User not in test users list
- Enable required APIs in Console

### Linear

**"Invalid token"**:
- Token expired
- Scopes changed
- Re-authorize

---

## Debugging Steps

### Step 1: Check Configuration

1. Verify all URLs are correct
2. Check credentials match what's in provider dashboard
3. Confirm scopes are valid

### Step 2: Test Manually

```bash
# Test OAuth token
curl -H "Authorization: Bearer TOKEN" \
     https://api.service.com/user

# Test API key
curl -H "X-API-Key: KEY" \
     https://api.service.com/health
```

### Step 3: Check Debug Logs

1. Go to **Debug Logs** page
2. Filter by the failing server
3. Look for error responses
4. Note HTTP status codes

### Step 4: Verify Token Status

1. Go to server details
2. Check if token exists
3. Look for expiration info
4. Try re-authorizing

### Step 5: Check Service Status

1. Visit service's status page
2. Check for outages
3. Look for API changes
4. Review service documentation

---

## Getting Help

### Information to Gather

When seeking help, collect:
1. Error message (exact text)
2. HTTP status code
3. Server type and URL
4. Authentication method used
5. Debug log entries

### Resources

- Check service's API documentation
- Search for specific error messages
- Review gateway logs for details
- Test with curl to isolate issue

---

## See Also

- [OAuth Setup](./oauth-setup.md) - OAuth configuration
- [API Key Setup](./api-key-setup.md) - API key configuration
- [Debug Logs](../web-ui/debug-logs-page.md) - Log inspection
