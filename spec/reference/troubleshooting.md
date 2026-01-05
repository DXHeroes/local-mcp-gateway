# Troubleshooting Guide

Solutions for common issues with Local MCP Gateway.

---

## Quick Diagnosis

### Step 1: Check Health

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

### Step 2: Check Database

```bash
curl http://localhost:3001/health/ready
```

Expected: `{"status":"ready","database":"connected"}`

### Step 3: Check Debug Logs

Open `http://localhost:3000/debug-logs` to see recent requests and errors.

---

## Gateway Issues

### Gateway won't start

**Symptoms**: Error when running `pnpm dev`

**Solutions**:

1. **Check Node.js version**
   ```bash
   node --version  # Should be 20+
   ```

2. **Check pnpm is installed**
   ```bash
   pnpm --version  # Should be 9+
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Check for port conflicts**
   ```bash
   lsof -i :3001  # Check if port is in use
   kill -9 <PID>  # Kill conflicting process
   ```

5. **Clear and reinstall**
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### Port already in use

**Error**: `EADDRINUSE: address already in use`

**Solutions**:

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev
```

### Database errors

**Error**: `SQLITE_CANTOPEN` or database corruption

**Solutions**:

1. **Reset database**
   ```bash
   pnpm db:reset
   ```

2. **Check permissions**
   ```bash
   ls -la ~/.local-mcp-gateway-data/
   ```

3. **Delete and recreate**
   ```bash
   rm ~/.local-mcp-gateway-data/local-mcp-gateway.db
   pnpm dev  # Will recreate
   ```

---

## Connection Issues

### Can't connect to gateway

**Symptoms**: Client shows "connection refused"

**Checklist**:

1. ✅ Gateway is running (`pnpm dev`)
2. ✅ Correct URL (`http://localhost:3001`)
3. ✅ No firewall blocking
4. ✅ Using HTTP (not HTTPS) for localhost

**Test**:
```bash
curl http://localhost:3001/health
```

### MCP server shows disconnected

**Symptoms**: Red status indicator, no tools

**Checklist**:

1. ✅ Server URL is correct
2. ✅ Server is running
3. ✅ Authentication configured
4. ✅ Network allows connection

**Debug**:
```bash
# Test server directly
curl -X POST <server-url> \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Timeout errors

**Symptoms**: Requests taking too long, timeout errors

**Causes**:
- Slow MCP server
- Network latency
- Large responses

**Solutions**:
1. Check server performance
2. Verify network connectivity
3. Consider server-side caching

---

## Tool Issues

### No tools appearing

**Symptoms**: Profile shows 0 tools

**Checklist**:

1. ✅ Profile has servers assigned
2. ✅ Servers are connected
3. ✅ Servers have tools

**Verify**:
```bash
# Check profile info
curl http://localhost:3001/api/mcp/my-profile/info | jq '.tools'
```

### Tool not found

**Error**: "Tool not found" when calling tool

**Causes**:
- Tool name wrong
- Tool prefixed due to conflict
- Server disconnected

**Solutions**:
1. Check exact tool name (may be prefixed)
2. Verify server is connected
3. Refresh tool list

### Wrong tool called

**Symptoms**: Tool from wrong server executed

**Cause**: Tool name conflict resolved to wrong server

**Solution**: Use prefixed name `serverid:toolname`

---

## Authentication Issues

### OAuth authorization fails

**Error**: "Invalid redirect_uri" or "Invalid client_id"

**Checklist**:

1. ✅ Client ID is correct
2. ✅ Redirect URI matches exactly:
   ```
   http://localhost:3001/api/oauth/callback
   ```
3. ✅ OAuth app exists and is active
4. ✅ Protocol matches (http vs https)

### Token expired

**Symptoms**: 401 errors, "Token expired"

**Solutions**:

1. **Re-authorize**
   - Go to server details
   - Click "Authorize"
   - Complete OAuth flow

2. **Check refresh token**
   - Some servers don't provide refresh tokens
   - Manual re-authorization required

### API key rejected

**Error**: 401 or 403 when using API key

**Checklist**:

1. ✅ API key is valid
2. ✅ Header name is correct
3. ✅ Header template format is correct
4. ✅ Key has required permissions

**Test manually**:
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
     <server-url>/health
```

---

## Client Integration Issues

### Claude Desktop not connecting

**Symptoms**: No tools in Claude Desktop

**Checklist**:

1. ✅ Config file exists and is valid JSON
2. ✅ Gateway is running
3. ✅ Claude Desktop fully restarted
4. ✅ Profile name matches

**Config location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Verify config**:
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

### Changes not taking effect

**Symptoms**: Old configuration still used

**Solutions**:

1. **Restart client completely**
   - Quit from menu bar (not just close window)
   - Reopen

2. **Check config syntax**
   - Validate JSON
   - No trailing commas
   - Correct quotes

### HTTPS required

**Error**: OAuth requires HTTPS

**Solutions**:

1. **Use localtunnel**
   ```bash
   pnpm dev:https
   ```

2. **Use ngrok**
   ```bash
   ngrok http 3001
   ```

3. **Update OAuth redirect URI** to HTTPS URL

---

## Performance Issues

### Slow tool calls

**Symptoms**: Tools take long to respond

**Causes**:
- Slow MCP server
- Large data transfer
- Network latency

**Diagnosis**:
1. Check Debug Logs for duration
2. Compare with direct server calls
3. Identify slow servers

### High memory usage

**Causes**:
- Many servers
- Large tool caches
- Debug log accumulation

**Solutions**:
1. Reduce number of servers
2. Restart gateway periodically
3. Clean debug logs

---

## UI Issues

### Page won't load

**Symptoms**: Blank page or errors in browser

**Solutions**:

1. **Check frontend is running**
   ```bash
   curl http://localhost:3000
   ```

2. **Check browser console**
   - Open DevTools (F12)
   - Check for errors

3. **Clear browser cache**

### Forms not submitting

**Symptoms**: Click button, nothing happens

**Causes**:
- JavaScript error
- Network issue
- Validation error

**Solutions**:
1. Check browser console for errors
2. Check network tab for requests
3. Look for validation messages

---

## Getting Help

### Information to Gather

When seeking help, collect:

1. **Error message** (exact text)
2. **Steps to reproduce**
3. **Environment**:
   - OS and version
   - Node.js version
   - Gateway version
4. **Relevant logs**:
   - Backend console output
   - Debug Logs entries
   - Browser console errors

### Where to Ask

1. Check this documentation
2. Search existing issues
3. Create new issue with details

---

## See Also

- [FAQ](./faq.md) - Common questions
- [Error Codes](./error-codes.md) - Error reference
- [Authentication Troubleshooting](../user-guide/authentication/troubleshooting-auth.md)
