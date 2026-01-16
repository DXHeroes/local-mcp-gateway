# Debug Module

## Description

Debug logging module for capturing and querying MCP traffic. Records all requests/responses between AI clients and MCP servers.

## Contents

- `debug.module.ts` - Module definition
- `debug.controller.ts` - REST API for debug log queries
- `debug.service.ts` - Debug log storage and retrieval

## Key Endpoints

- `GET /api/debug/logs` - Query debug logs with filters
- `DELETE /api/debug/logs` - Clear debug logs

## Key Concepts

- **Log Capture**: Records MCP requests and responses
- **Filtering**: Query by profile, server, type, status
- **Auto-Cleanup**: Configurable log retention
- **Real-time**: Supports polling for live monitoring

## Debug Log Fields

- Profile and MCP server identification
- Request/response payloads
- Duration and status
- Timestamps
