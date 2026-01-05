# Debug API

Debugging and logging endpoints.

## Overview

The Debug API provides access to MCP traffic logs for debugging and troubleshooting.

---

## Endpoints

### SSE Log Stream

```http
GET /debug/logs
```

Real-time SSE stream of debug logs.

**Headers:**
```http
Accept: text/event-stream
```

**Response:** SSE stream of log entries

**Events:**

| Event | Description |
|-------|-------------|
| `log` | New log entry |
| `heartbeat` | Keep-alive ping |

**Example stream:**
```
event: log
data: {"id":"uuid","timestamp":"2024-01-01T00:00:00Z","type":"request","direction":"outgoing","method":"tools/call","serverId":"github-id","data":{"name":"create_issue"}}

event: log
data: {"id":"uuid","timestamp":"2024-01-01T00:00:01Z","type":"response","direction":"incoming","serverId":"github-id","data":{"content":[...]}}

event: heartbeat
data: {"timestamp":"2024-01-01T00:00:10Z"}
```

---

### Get Recent Logs

```http
GET /api/debug/logs
```

Retrieves recent logs from buffer.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 100 | Max entries to return |
| offset | number | 0 | Skip entries |
| serverId | string | - | Filter by server |
| profileId | string | - | Filter by profile |
| type | string | - | Filter by type (request/response) |

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2024-01-01T00:00:00Z",
      "type": "request",
      "direction": "outgoing",
      "method": "tools/call",
      "profileSlug": "development",
      "serverId": "github-id",
      "serverName": "GitHub",
      "data": {
        "name": "create_issue",
        "arguments": { "title": "Bug" }
      },
      "duration": null
    },
    {
      "id": "uuid",
      "timestamp": "2024-01-01T00:00:01Z",
      "type": "response",
      "direction": "incoming",
      "method": "tools/call",
      "profileSlug": "development",
      "serverId": "github-id",
      "serverName": "GitHub",
      "data": {
        "content": [{ "type": "text", "text": "Created #123" }]
      },
      "duration": 1234
    }
  ],
  "total": 2
}
```

---

### Get Log Entry

```http
GET /api/debug/logs/:id
```

Get specific log entry by ID.

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "type": "request",
  "direction": "outgoing",
  "method": "tools/call",
  "profileSlug": "development",
  "serverId": "github-id",
  "serverName": "GitHub",
  "data": { ... },
  "headers": { ... },
  "rawRequest": "{ ... }",
  "rawResponse": "{ ... }"
}
```

---

### Clear Logs

```http
DELETE /api/debug/logs
```

Clears all logs from buffer.

**Response:**
```json
{
  "success": true,
  "clearedCount": 150
}
```

---

### Get Log Stats

```http
GET /api/debug/logs/stats
```

Get logging statistics.

**Response:**
```json
{
  "bufferSize": 150,
  "bufferCapacity": 1000,
  "byServer": {
    "github-id": 75,
    "linear-id": 75
  },
  "byType": {
    "request": 75,
    "response": 75
  },
  "byMethod": {
    "tools/call": 50,
    "tools/list": 25,
    "initialize": 25
  },
  "errorCount": 5,
  "averageDuration": 234
}
```

---

## Log Entry Schema

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique log ID |
| timestamp | string | ISO 8601 timestamp |
| type | string | `request` or `response` |
| direction | string | `outgoing` or `incoming` |
| method | string | JSON-RPC method |
| profileSlug | string | Profile slug |
| serverId | string | Server UUID |
| serverName | string | Server display name |
| data | object | Request/response payload |
| duration | number | Response time in ms (responses only) |
| error | object | Error details (if failed) |

### Log Types

| Type | Direction | Description |
|------|-----------|-------------|
| request | outgoing | Request from gateway to server |
| response | incoming | Response from server to gateway |
| request | incoming | Request from client to gateway |
| response | outgoing | Response from gateway to client |

---

## Filtering

### By Server

```http
GET /api/debug/logs?serverId=uuid-123
```

### By Profile

```http
GET /api/debug/logs?profileId=uuid-456
```

### By Method

```http
GET /api/debug/logs?method=tools/call
```

### By Time Range

```http
GET /api/debug/logs?from=2024-01-01T00:00:00Z&to=2024-01-01T23:59:59Z
```

### Multiple Filters

```http
GET /api/debug/logs?serverId=uuid&type=response&limit=50
```

---

## Configuration

### Buffer Size

Logs stored in circular buffer:

```bash
DEBUG_LOG_BUFFER_SIZE=1000  # Default
```

### Log Level

```bash
DEBUG_LOG_LEVEL=verbose  # verbose, normal, minimal
```

| Level | Includes |
|-------|----------|
| minimal | Errors only |
| normal | Requests, responses, errors |
| verbose | All data including headers, raw payloads |

---

## Sensitive Data

### Redacted Fields

Debug logs automatically redact:
- `Authorization` headers
- `X-Api-Key` headers
- Token values
- Client secrets

**Example redacted log:**
```json
{
  "headers": {
    "authorization": "[REDACTED]",
    "content-type": "application/json"
  }
}
```

---

## Error Logs

### Error Entry Format

```json
{
  "id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "type": "response",
  "direction": "incoming",
  "method": "tools/call",
  "serverId": "github-id",
  "error": {
    "code": -32001,
    "message": "Tool execution failed",
    "data": {
      "originalError": "Network timeout"
    }
  },
  "duration": 30000
}
```

### Get Errors Only

```http
GET /api/debug/logs?hasError=true
```

---

## Performance

### Response Time Tracking

Each response includes duration:
```json
{
  "type": "response",
  "duration": 234
}
```

### Slow Request Detection

Get slow requests (>1000ms):
```http
GET /api/debug/logs?minDuration=1000
```

---

## See Also

- [Debug Logs Page](../../user-guide/web-ui/debug-logs-page.md) - UI guide
- [Troubleshooting](../../reference/troubleshooting.md) - Common issues
- [MCP Servers API](./mcp-servers-api.md) - Server management
