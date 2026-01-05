# Debug Logs Page

The Debug Logs page provides visibility into all MCP traffic flowing through the gateway.

## Overview

Access at: `http://localhost:3000/debug-logs`

The page displays:
- All MCP requests and responses
- Filtering options
- Expandable payload details
- Error information

---

## Log Entry Fields

Each log entry contains:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the request was made |
| **Profile** | Which profile handled the request |
| **Server** | Which MCP server was called |
| **Request Type** | MCP method called |
| **Status** | Success, Error, or Pending |
| **Duration** | Time taken in milliseconds |
| **Request Payload** | Full JSON-RPC request |
| **Response Payload** | Full JSON-RPC response |
| **Error Message** | Error details (if failed) |

---

## Filtering

### Filter by Profile

Select a specific profile from the dropdown to see only requests for that profile.

**Use case**: Focus on a specific use-case or environment.

### Filter by MCP Server

Select a specific server to see requests to that server.

**Use case**: Debug a particular integration.

### Filter by Request Type

Filter by MCP operation:

| Type | Description |
|------|-------------|
| `initialize` | Server initialization |
| `tools/list` | Tool discovery |
| `tools/call` | Tool execution |
| `resources/list` | Resource discovery |
| `resources/read` | Resource retrieval |

### Filter by Status

| Status | Description |
|--------|-------------|
| **Pending** | Request in progress |
| **Success** | Completed successfully |
| **Error** | Request failed |

### Combining Filters

All filters can be combined. For example:
- Profile: "development"
- Server: "GitHub"
- Type: "tools/call"
- Status: "Error"

Shows only failed tool calls to GitHub in the development profile.

---

## Log Entry Display

### Collapsed View

Each log shows summary information:

```
[Timestamp] [Status Badge] [Request Type]
Profile: development | Server: GitHub | Duration: 234ms
```

### Expanded View

Click a log entry to expand and see:

#### Request Payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "github_create_issue",
    "arguments": {
      "repo": "org/repo",
      "title": "Bug fix",
      "body": "Description..."
    }
  }
}
```

#### Response Payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\": 123, \"url\": \"...\"}"
      }
    ]
  }
}
```

#### Error Details

If the request failed:

```
Error: 401 Unauthorized
Authentication required. Please re-authorize.
```

---

## Status Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| Success | Green | Request completed successfully |
| Error | Red | Request failed |
| Pending | Yellow | Request still in progress |

---

## Understanding Logs

### Successful Tool Call

```
✅ Success | tools/call | 234ms
Request: {"method": "tools/call", "params": {"name": "search", "arguments": {...}}}
Response: {"result": {"content": [...]}}
```

### Failed Tool Call

```
❌ Error | tools/call | 1523ms
Request: {"method": "tools/call", "params": {"name": "create_issue", "arguments": {...}}}
Error: 401 Unauthorized
```

### Initialization

```
✅ Success | initialize | 89ms
Request: {"method": "initialize", "params": {"clientInfo": {...}}}
Response: {"result": {"serverInfo": {...}, "capabilities": {...}}}
```

---

## Common Patterns

### Authentication Errors

Look for:
- Status: Error
- Error Message: "401 Unauthorized" or "403 Forbidden"
- Check OAuth token or API key

### Timeout Errors

Look for:
- Status: Error
- Duration: Very high (e.g., 30000ms)
- Error Message: "Timeout" or "ETIMEDOUT"

### Missing Tools

If a tool call fails with "tool not found":
1. Check `tools/list` requests
2. Verify tool is in the response
3. Check tool name matches exactly

### Rate Limiting

Look for:
- Status: Error
- Error Message: "429 Too Many Requests"
- Multiple requests in short time

---

## Using Logs for Debugging

### Step 1: Reproduce the Issue

Make the same request that's causing problems.

### Step 2: Find the Log

Filter by:
- Profile used
- Server involved
- Recent timestamp

### Step 3: Analyze

Expand the log entry and check:
- Request parameters correct?
- Response as expected?
- Error message informative?

### Step 4: Identify Root Cause

Common causes:
- **Auth error**: Token expired, wrong credentials
- **Bad request**: Missing/invalid parameters
- **Server error**: MCP server issue
- **Network error**: Connectivity problem

---

## Log Retention

### Current Behavior

- Logs stored in SQLite database
- No automatic cleanup
- Deleted when profile is deleted

### Managing Log Volume

For high-volume usage:
- Logs will accumulate over time
- Database size increases
- May need manual cleanup

---

## Tips

### Real-Time Monitoring

Keep Debug Logs page open while using Claude to see requests in real-time.

### Quick Filtering

Use the URL to bookmark filtered views:
```
http://localhost:3000/debug-logs?profile=development&status=error
```

### Copy Payloads

Click in the payload area and use Ctrl/Cmd+C to copy JSON for further analysis.

### Export Logs

Currently logs can only be viewed in UI. For export:
- Copy individual payloads manually
- Query database directly if needed

---

## Troubleshooting

### No logs appearing

1. Make sure requests go through the gateway
2. Check profile is correctly configured
3. Verify server is assigned to profile
4. Refresh the page

### Page loads slowly

1. Apply filters to reduce results
2. Consider log cleanup if very large
3. Use pagination if available

### Missing request details

1. Some responses may be truncated
2. Check database for full data
3. Very large payloads may be summarized

### Logs not updating

1. Page doesn't auto-refresh
2. Manually refresh browser
3. Check backend is running

---

## See Also

- [Debugging MCP Traffic](../use-cases/debugging-mcp-traffic.md) - Use case guide
- [Server Detail Page](./server-detail-page.md) - Per-server logs
- [Troubleshooting Guide](../../reference/troubleshooting.md) - Common issues
