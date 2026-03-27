# Plan: Fix stale API key cache in ProxyService

## Context

When a user updates an MCP server's API key (e.g. GitHub token), the `ProxyService.serverInstances` cache keeps the old `RemoteHttpMcpServer` instance with the stale token. All subsequent requests use the old token, causing `HTTP 400` / `INVALID_API_KEY` errors. The cache is never invalidated.

This is visible in the screenshot: GitHub API calls through `gw profile-one` fail with "HTTP 400: Failed to parse response as JSON" and "INVALID_API_KEY" even after the user regenerated the token.

## Root Cause

`ProxyService` caches server instances in `private readonly serverInstances = new Map<string, McpServer>()` (line 120 of `proxy.service.ts`). Once a `RemoteHttpMcpServer` is created with an API key, it stays cached forever. When `McpService.update()` changes the API key in the DB (line 238), it only invalidates its own batch cache — it never notifies `ProxyService` to evict the stale instance.

## Fix

### 1. Add `evictServer(serverId)` method to `ProxyService`

```typescript
evictServer(serverId: string): void {
  this.serverInstances.delete(serverId);
}
```

File: `apps/backend/src/modules/proxy/proxy.service.ts`

### 2. Call `proxyService.evictServer(id)` when MCP server is updated or deleted

In `McpService.update()` and `McpService.delete()`, after the DB write, call the eviction.

File: `apps/backend/src/modules/mcp/mcp.service.ts`

This requires injecting `ProxyService` into `McpService`, or using NestJS event emitter to decouple them. Let me check which is simpler.

### Approach: Direct injection

Inject `ProxyService` into `McpService` and call `evictServer()` directly. This is simpler and more explicit than events.

However, there may be a circular dependency: `ProxyService` depends on `McpRegistry` (from mcp module) and `McpService` would depend on `ProxyService` (from proxy module). Let me check.

**Alternative: Event-based** — Use `EventEmitter2` (already used in the project for `GATEWAY_PROFILE_CHANGED`) to emit an event when server config changes, and have `ProxyService` listen for it. This avoids circular deps entirely.

### Recommended: Event-based approach

1. Define event constant `MCP_SERVER_CHANGED` in proxy module
2. `McpService` emits `MCP_SERVER_CHANGED` with `{ serverId }` on update/delete
3. `ProxyService` listens via `@OnEvent(MCP_SERVER_CHANGED)`:
   - Evicts the cached instance from `serverInstances`
   - Re-reads the updated server config from the database
   - Creates and initializes a new instance with the fresh API key
   - Caches the new instance
   - This ensures the server status (connected/tools) is immediately refreshed

### Files to modify

- `apps/backend/src/modules/proxy/proxy.service.ts` — add `@OnEvent` handler that evicts + reinitializes
- `apps/backend/src/modules/mcp/mcp.service.ts` — emit event on update/delete

### Key code paths

**proxy.service.ts** additions:
```typescript
import { OnEvent } from '@nestjs/event-emitter';

export const MCP_SERVER_CHANGED = 'mcp.server.changed';

@OnEvent(MCP_SERVER_CHANGED)
async handleServerChanged(payload: { serverId: string }) {
  // 1. Evict old cached instance
  this.serverInstances.delete(payload.serverId);

  // 2. Re-read server from DB with fresh config/apiKey
  const server = await this.prisma.mcpServer.findUnique({
    where: { id: payload.serverId },
  });

  if (!server) return; // Server was deleted

  // 3. Re-initialize with new config (this creates a fresh instance
  //    with the updated API key and caches it)
  try {
    await this.getServerInstance(server);
    appLogger.info(
      { event: 'mcp.server.reinitialized', serverId: payload.serverId },
      'MCP server reinitialized after config change'
    );
  } catch (error) {
    appLogger.warn(
      {
        event: 'mcp.server.reinitialize.failed',
        serverId: payload.serverId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to reinitialize MCP server after config change'
    );
  }
}
```

**mcp.service.ts** additions:
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MCP_SERVER_CHANGED } from '../proxy/proxy.service.js';

// In constructor:
constructor(
  ...existing,
  private readonly eventEmitter: EventEmitter2,
)

// In update() after DB write + invalidateBatchCache:
this.eventEmitter.emit(MCP_SERVER_CHANGED, { serverId: id });

// In delete() after DB write + invalidateBatchCache:
this.eventEmitter.emit(MCP_SERVER_CHANGED, { serverId: id });
```

## Verification

1. Start dev server: `pnpm dev:backend`
2. Configure a GitHub MCP server with a valid token
3. Make a tool call — should succeed
4. Update the API key to an invalid value via the UI
5. Make a tool call — should fail with auth error (not use stale cached token)
6. Update the API key back to valid token
7. Server should immediately re-initialize (check logs for `mcp.server.reinitialized`)
8. Make a tool call — should succeed (fresh instance with new key)
8. Run `pnpm --filter @dxheroes/local-mcp-backend build` — verify no TS errors
