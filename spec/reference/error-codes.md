# Error Codes Reference

Reference for error codes returned by Local MCP Gateway.

---

## HTTP Status Codes

### Success Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Deleted successfully |

### Client Error Codes

| Code | Name | Description | Common Causes |
|------|------|-------------|---------------|
| 400 | Bad Request | Invalid request | Malformed JSON, missing fields |
| 401 | Unauthorized | Authentication required | Missing/invalid token |
| 403 | Forbidden | Access denied | Insufficient permissions |
| 404 | Not Found | Resource not found | Wrong ID, deleted resource |
| 409 | Conflict | Resource conflict | Duplicate name |
| 422 | Unprocessable Entity | Validation error | Invalid field values |
| 429 | Too Many Requests | Rate limited | Too many requests |

### Server Error Codes

| Code | Name | Description | Common Causes |
|------|------|-------------|---------------|
| 500 | Internal Server Error | Server error | Bug, database issue |
| 502 | Bad Gateway | Upstream error | MCP server error |
| 503 | Service Unavailable | Service down | Gateway overloaded |
| 504 | Gateway Timeout | Upstream timeout | MCP server slow |

---

## JSON-RPC Error Codes

Standard JSON-RPC 2.0 error codes:

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Invalid parameters |
| -32603 | Internal error | Internal JSON-RPC error |

### MCP-Specific Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32001 | Tool not found | Requested tool doesn't exist |
| -32002 | Resource not found | Requested resource doesn't exist |
| -32003 | Server not connected | MCP server is disconnected |
| -32004 | Authentication required | OAuth/API key needed |
| -32005 | Authentication failed | Token invalid/expired |

---

## Error Response Format

### REST API Errors

```json
{
  "error": {
    "message": "Profile not found",
    "code": "NOT_FOUND"
  }
}
```

### JSON-RPC Errors

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": {
      "method": "unknown_method"
    }
  }
}
```

---

## Common Errors and Solutions

### "Profile not found"

**Code**: 404 / NOT_FOUND

**Cause**: Profile ID or name doesn't exist.

**Solution**:
1. Check profile name/ID is correct
2. Verify profile wasn't deleted
3. List profiles to see available ones

### "Server not connected"

**Code**: -32003

**Cause**: MCP server is unreachable.

**Solution**:
1. Check server URL
2. Verify server is running
3. Check authentication
4. View server details for errors

### "Tool not found"

**Code**: -32001

**Cause**: Tool name doesn't match any available tool.

**Solution**:
1. Check exact tool name
2. May be prefixed: `serverid:toolname`
3. Verify server is connected
4. List tools to see available ones

### "Invalid redirect_uri"

**Code**: OAuth error

**Cause**: Callback URL doesn't match registered URL.

**Solution**:
1. Check OAuth app settings
2. Ensure exact match including:
   - Protocol (http/https)
   - Port
   - Path

### "Token expired"

**Code**: 401 / -32005

**Cause**: OAuth access token has expired.

**Solution**:
1. Gateway will try refresh automatically
2. If fails, re-authorize via UI
3. Check if refresh token is available

### "Rate limit exceeded"

**Code**: 429

**Cause**: Too many requests.

**Solution**:
1. Wait for rate limit reset
2. Reduce request frequency
3. Check `Retry-After` header

### "Invalid JSON"

**Code**: -32700

**Cause**: Request body is not valid JSON.

**Solution**:
1. Validate JSON syntax
2. Check for trailing commas
3. Ensure proper quoting

### "Validation error"

**Code**: 422

**Cause**: Field values don't pass validation.

**Solution**:
1. Check field requirements
2. Verify data types
3. Check length limits

---

## Debugging Errors

### Step 1: Check Response

Look at the full error response:
- HTTP status code
- Error message
- Error code
- Additional data

### Step 2: Check Debug Logs

Open Debug Logs page and find the request:
- See full request payload
- See full response payload
- Check timing

### Step 3: Test Directly

Try the request directly:
```bash
curl -v -X POST http://localhost:3001/api/... \
  -H "Content-Type: application/json" \
  -d '...'
```

### Step 4: Check Server Logs

Look at backend console output for:
- Stack traces
- Additional context
- Database errors

---

## See Also

- [Troubleshooting](./troubleshooting.md) - Problem solutions
- [FAQ](./faq.md) - Common questions
- [API Reference](../technical/api/rest-api.md) - API documentation
