# Proxy Module

## Description

MCP proxy module that exposes profile endpoints for AI clients. Handles MCP protocol communication (HTTP/SSE) and routes requests to underlying servers.

## Contents

- `proxy.module.ts` - Module definition
- `proxy.controller.ts` - MCP protocol endpoints (HTTP, SSE)
- `proxy.service.ts` - Request routing and tool aggregation

## Key Endpoints

- `POST /api/mcp/:profileSlug` - HTTP MCP endpoint (Streamable HTTP)
- `GET /api/mcp/:profileSlug/sse` - SSE MCP endpoint (legacy)
- `POST /api/mcp/:profileSlug/message` - SSE message endpoint (legacy)

## Key Concepts

- **Streamable HTTP**: Modern MCP transport (single POST endpoint)
- **SSE Transport**: Legacy Server-Sent Events transport
- **Tool Aggregation**: Combines tools from all profile MCP servers
- **Request Routing**: Routes tool calls to correct MCP server
- **Debug Logging**: All traffic is logged for debugging

## Proxy Flow

1. AI client connects to profile endpoint
2. Proxy aggregates tool lists from all servers
3. Client calls a tool
4. Proxy routes to correct MCP server
5. Response returned to client
6. All traffic logged to debug logs
