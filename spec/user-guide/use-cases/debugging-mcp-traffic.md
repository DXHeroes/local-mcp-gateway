# Use Case: Debugging MCP Traffic

Understand and troubleshoot communication between AI and MCP tools using the gateway's built-in debug logging.

## Overview

| Aspect | Details |
|--------|---------|
| **Goal** | Inspect and debug MCP requests/responses |
| **Difficulty** | Beginner to Intermediate |
| **Time** | 5-15 minutes |
| **Prerequisites** | Local MCP Gateway running with at least one profile |

---

## Why Debug MCP Traffic?

When AI tools don't work as expected, you need visibility:

- **Tool failures** - Why did a tool call fail?
- **Wrong results** - What data did the tool return?
- **Performance issues** - How long do requests take?
- **Integration testing** - Is the MCP server responding correctly?
- **Development** - Testing new MCP servers

---

## The Debug Logs Page

### Accessing Debug Logs

1. Open the gateway UI at `http://localhost:3000`
2. Click **"Debug Logs"** in the navigation

### What's Logged

Every MCP request through the gateway is logged:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the request was made |
| **Profile** | Which profile handled the request |
| **Server** | Which MCP server was called |
| **Request Type** | Type of MCP operation |
| **Status** | Success, error, or pending |
| **Duration** | Time taken in milliseconds |
| **Request Payload** | Full JSON-RPC request |
| **Response Payload** | Full JSON-RPC response |
| **Error Message** | Error details if failed |

---

## Filtering Logs

### By Profile

Select a specific profile to see only requests for that profile.

Use case: Debug a specific use case or environment.

### By MCP Server

Select a specific server to see requests to that server.

Use case: Debug a particular integration.

### By Request Type

Filter by MCP operation:

| Type | Description |
|------|-------------|
| `initialize` | Server initialization |
| `tools/list` | Tool discovery |
| `tools/call` | Tool execution |
| `resources/list` | Resource discovery |
| `resources/read` | Resource retrieval |

### By Status

| Status | Meaning |
|--------|---------|
| **Pending** | Request in progress |
| **Success** | Request completed successfully |
| **Error** | Request failed |

---

## Reading Log Entries

### Successful Request

```json
{
  "status": "success",
  "requestType": "tools/call",
  "profile": "development",
  "mcpServer": "GitHub",
  "durationMs": 234,
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_issues",
      "arguments": {
        "repo": "myorg/myrepo",
        "state": "open"
      }
    }
  },
  "response": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "content": [
        {
          "type": "text",
          "text": "[{\"id\": 123, \"title\": \"Bug fix\"}]"
        }
      ]
    }
  }
}
```

### Failed Request

```json
{
  "status": "error",
  "requestType": "tools/call",
  "errorMessage": "401 Unauthorized",
  "request": {
    "method": "tools/call",
    "params": {
      "name": "list_issues"
    }
  },
  "response": {
    "error": {
      "code": -32001,
      "message": "Authentication required"
    }
  }
}
```

---

## Common Debugging Scenarios

### Scenario 1: Tool Not Found

**Symptom**: Claude says it can't find a tool

**Debug steps**:

1. Filter by request type: `tools/list`
2. Check which tools are returned
3. Verify the tool name matches what Claude is trying to call

**Common causes**:
- Server not connected
- Tool name changed
- Server not assigned to profile

### Scenario 2: Authentication Failure

**Symptom**: Tool calls return 401/403 errors

**Debug steps**:

1. Filter by status: Error
2. Look for auth-related error messages
3. Check the request headers in payload

**Common causes**:
- OAuth token expired
- API key invalid
- Missing required scopes

### Scenario 3: Slow Responses

**Symptom**: Tools take too long to respond

**Debug steps**:

1. Sort by duration (highest first)
2. Identify which servers are slow
3. Check payload sizes

**Common causes**:
- Large data transfers
- Slow external APIs
- Network latency
- Server overload

### Scenario 4: Wrong Data Returned

**Symptom**: Tool returns unexpected results

**Debug steps**:

1. Find the specific request in logs
2. Expand response payload
3. Compare expected vs actual data

**Common causes**:
- Wrong parameters passed
- API behavior changed
- Data formatting issues

### Scenario 5: Intermittent Failures

**Symptom**: Tool works sometimes, fails others

**Debug steps**:

1. Look at multiple requests over time
2. Compare successful vs failed requests
3. Check for patterns (time of day, specific inputs)

**Common causes**:
- Rate limiting
- Network issues
- Token expiration
- Server instability

---

## Using Logs for Development

### Testing New MCP Servers

1. Add your server to a test profile
2. Make requests through Claude
3. Check debug logs for:
   - Correct tool discovery
   - Proper request formatting
   - Expected response structure
   - Error handling

### Validating Tool Parameters

1. Make a tool call with known parameters
2. Check the request payload in logs
3. Verify parameters match MCP specification
4. Adjust server implementation if needed

### Performance Optimization

1. Identify slow tools via duration
2. Analyze request/response sizes
3. Look for unnecessary data in responses
4. Implement caching or pagination

---

## Advanced Debugging

### Comparing Requests

When a tool works for one input but not another:

1. Find both requests in logs
2. Compare request payloads side by side
3. Identify differences in parameters
4. Check response structure differences

### Tracing Multi-Server Requests

When a profile has multiple servers:

1. Filter by profile
2. Note which server each request went to
3. Check for tool name prefixes (server conflict resolution)
4. Verify routing is correct

### Monitoring Tool Usage Patterns

Over time, logs show:

1. Most frequently used tools
2. Error rate trends
3. Response time patterns
4. Peak usage times

---

## Log Retention

### Current Behavior

- Logs are stored in SQLite database
- No automatic cleanup (grows over time)
- Associated with profile (deleted when profile deleted)

### Managing Log Size

For high-volume usage:

```bash
# Check database size
ls -lh ~/.local-mcp-gateway-data/local-mcp-gateway.db

# Manual cleanup via SQL (if needed)
# Be careful with production data
```

---

## Integration with External Tools

### Exporting Logs

Currently logs are viewable via UI only. Future options:
- Export to JSON
- Stream to logging service
- Integration with Sentry/DataDog

### Alerting

Consider monitoring:
- Error rate thresholds
- Response time thresholds
- Specific error patterns

---

## Best Practices

### For Development

- Test with debug logs open
- Validate every new server integration
- Check both success and error cases
- Document expected behavior

### For Production

- Review logs regularly
- Set up monitoring/alerts
- Keep log retention manageable
- Sanitize sensitive data

### For Troubleshooting

- Start with recent errors
- Filter to narrow down
- Compare working vs broken
- Check the full payload

---

## Troubleshooting the Debug Page

### Logs not appearing

1. Make sure requests go through the gateway (not direct)
2. Check profile is correctly configured
3. Verify server is assigned to profile
4. Refresh the page

### Page loading slowly

1. Reduce the date range
2. Apply filters before loading
3. Consider log cleanup if too large

### Missing request details

1. Some fields may be truncated
2. Check database for full payload
3. Increase logging detail if needed

---

## Next Steps

- [API Reference](../../technical/api/debug-api.md) - Debug API endpoints
- [Server Detail Page](../web-ui/server-detail-page.md) - Per-server debugging
- [Troubleshooting Guide](../../reference/troubleshooting.md) - Common issues
