# Data Flow

Detailed request and response flows through Local MCP Gateway.

## Overview

This document describes how data flows through the gateway for various operations.

---

## Profile Proxy Flow

### Tool List Request

```
Client                 Gateway                    MCP Server 1        MCP Server 2
  │                       │                            │                    │
  │── GET /mcp/:slug ────▶│                            │                    │
  │   (SSE connection)    │                            │                    │
  │                       │                            │                    │
  │                       │── Initialize ─────────────▶│                    │
  │                       │◀── OK ────────────────────│                    │
  │                       │                            │                    │
  │                       │── Initialize ────────────────────────────────▶│
  │                       │◀── OK ───────────────────────────────────────│
  │                       │                            │                    │
  │                       │── tools/list ────────────▶│                    │
  │                       │◀── [tool_a, tool_b] ──────│                    │
  │                       │                            │                    │
  │                       │── tools/list ──────────────────────────────▶│
  │                       │◀── [tool_c] ────────────────────────────────│
  │                       │                            │                    │
  │                       │   Aggregate with prefixes:                      │
  │                       │   - server1__tool_a                             │
  │                       │   - server1__tool_b                             │
  │                       │   - server2__tool_c                             │
  │                       │                            │                    │
  │◀── SSE: tools/list ───│                            │                    │
```

### Tool Call Request

```
Client                 Gateway                    Target MCP Server
  │                       │                            │
  │── POST /mcp/:slug ───▶│                            │
  │   tools/call          │                            │
  │   "server1__tool_a"   │                            │
  │                       │                            │
  │                       │   Parse prefix:            │
  │                       │   server = "server1"       │
  │                       │   tool = "tool_a"          │
  │                       │                            │
  │                       │── tools/call ────────────▶│
  │                       │   "tool_a"                 │
  │                       │                            │
  │                       │◀── Result ────────────────│
  │                       │                            │
  │◀── Result ────────────│                            │
```

---

## OAuth Authorization Flow

### Initial Authorization

```
User                Browser               Gateway              Auth Server
 │                    │                      │                      │
 │── Click Authorize ▶│                      │                      │
 │                    │                      │                      │
 │                    │── GET /oauth/start ─▶│                      │
 │                    │                      │                      │
 │                    │                      │   Generate PKCE:     │
 │                    │                      │   - code_verifier    │
 │                    │                      │   - code_challenge   │
 │                    │                      │   - state            │
 │                    │                      │                      │
 │                    │                      │   Store in session   │
 │                    │                      │                      │
 │                    │◀── 302 Redirect ─────│                      │
 │                    │   to auth URL        │                      │
 │                    │                      │                      │
 │                    │── GET /authorize ───────────────────────────▶│
 │                    │   + code_challenge   │                      │
 │                    │                      │                      │
 │                    │◀── Login Page ─────────────────────────────│
 │                    │                      │                      │
 │◀── Login Form ─────│                      │                      │
 │                    │                      │                      │
 │── Credentials ────▶│                      │                      │
 │                    │── POST /login ──────────────────────────────▶│
 │                    │                      │                      │
 │                    │◀── 302 Callback ────────────────────────────│
 │                    │   + code             │                      │
 │                    │                      │                      │
 │                    │── GET /callback ────▶│                      │
 │                    │   + code + state     │                      │
 │                    │                      │                      │
 │                    │                      │── POST /token ───────▶│
 │                    │                      │   + code              │
 │                    │                      │   + code_verifier     │
 │                    │                      │                      │
 │                    │                      │◀── Tokens ───────────│
 │                    │                      │                      │
 │                    │                      │   Store encrypted    │
 │                    │                      │                      │
 │                    │◀── 302 Success ──────│                      │
 │                    │                      │                      │
 │◀── Success Page ───│                      │                      │
```

### Token Refresh

```
Gateway                              Auth Server
  │                                       │
  │   Access token expired                │
  │                                       │
  │── POST /token ───────────────────────▶│
  │   grant_type=refresh_token            │
  │   refresh_token=xxx                   │
  │                                       │
  │◀── New tokens ───────────────────────│
  │                                       │
  │   Update stored tokens                │
```

---

## MCP Server Connection Flow

### Remote HTTP Server

```
Gateway                              Remote Server
  │                                       │
  │── POST /mcp ─────────────────────────▶│
  │   JSON-RPC initialize                 │
  │   Headers: Authorization              │
  │                                       │
  │◀── 200 OK ───────────────────────────│
  │   serverInfo, capabilities            │
  │                                       │
  │── POST /mcp ─────────────────────────▶│
  │   JSON-RPC tools/list                 │
  │                                       │
  │◀── 200 OK ───────────────────────────│
  │   tools[]                             │
```

### Remote SSE Server

```
Gateway                              Remote Server
  │                                       │
  │── GET /sse ──────────────────────────▶│
  │   Accept: text/event-stream           │
  │                                       │
  │◀── SSE: endpoint ────────────────────│
  │   (message endpoint URL)              │
  │                                       │
  │── POST /message ─────────────────────▶│
  │   JSON-RPC initialize                 │
  │                                       │
  │◀── SSE: message ─────────────────────│
  │   serverInfo, capabilities            │
  │                                       │
  │   Connection stays open               │
  │   for bidirectional comms             │
```

### External Stdio Server

```
Gateway                              Child Process
  │                                       │
  │── spawn(command, args) ──────────────▶│
  │                                       │
  │── stdin: JSON-RPC initialize ────────▶│
  │                                       │
  │◀── stdout: JSON-RPC response ────────│
  │                                       │
  │   Process stays running               │
  │   for session duration                │
```

---

## Debug Log Flow

```
Client               Gateway                    MCP Server
  │                     │                           │
  │── Tool call ───────▶│                           │
  │                     │                           │
  │                     │   Log: REQUEST            │
  │                     │   - timestamp             │
  │                     │   - method                │
  │                     │   - params                │
  │                     │                           │
  │                     │── Forward ───────────────▶│
  │                     │                           │
  │                     │◀── Response ─────────────│
  │                     │                           │
  │                     │   Log: RESPONSE           │
  │                     │   - timestamp             │
  │                     │   - result                │
  │                     │   - duration              │
  │                     │                           │
  │◀── Result ─────────│                           │

Browser              Gateway
  │                     │
  │── GET /debug/logs ─▶│
  │   (SSE)             │
  │                     │
  │◀── SSE: log entry ──│
  │◀── SSE: log entry ──│
  │   ...               │
```

---

## Database Operations

### Profile CRUD Flow

```
API Request          Route Handler          Database
    │                     │                     │
    │── POST /profiles ──▶│                     │
    │   { name, slug }    │                     │
    │                     │                     │
    │                     │   Validate slug     │
    │                     │   unique            │
    │                     │                     │
    │                     │── INSERT ──────────▶│
    │                     │                     │
    │                     │◀── Profile ────────│
    │                     │                     │
    │◀── 201 Created ─────│                     │
```

### Token Storage Flow

```
OAuth Callback       OAuthManager            Database
    │                     │                     │
    │── Store tokens ────▶│                     │
    │                     │                     │
    │                     │   Encrypt tokens    │
    │                     │   with AES-256      │
    │                     │                     │
    │                     │── UPSERT ──────────▶│
    │                     │   encrypted_data    │
    │                     │                     │
    │                     │◀── OK ─────────────│
    │                     │                     │
    │◀── OK ──────────────│                     │
```

---

## Error Handling Flow

### MCP Server Error

```
Client               Gateway                    MCP Server
  │                     │                           │
  │── Tool call ───────▶│                           │
  │                     │                           │
  │                     │── Forward ───────────────▶│
  │                     │                           │
  │                     │◀── Error Response ───────│
  │                     │   { code: -32000 }        │
  │                     │                           │
  │                     │   Log error               │
  │                     │   Mark server status      │
  │                     │                           │
  │◀── Error Response ──│                           │
  │   { code: -32000 }  │                           │
```

### Connection Failure

```
Gateway                              MCP Server
  │                                       │
  │── Connect ───────────────────────────▶│
  │                                       │
  │◀── Connection refused ───────────────│
  │                                       │
  │   Retry with backoff:                 │
  │   1s, 2s, 4s, 8s...                   │
  │                                       │
  │── Connect (retry) ───────────────────▶│
  │                                       │
  │◀── Connection refused ───────────────│
  │                                       │
  │   Mark server as "disconnected"       │
  │   Return partial results              │
```

---

## See Also

- [System Overview](./system-overview.md) - Architecture diagram
- [API Reference](../api/README.md) - API documentation
- [Proxy API](../api/proxy-api.md) - Proxy endpoint details
