# Toggl Track MCP Package

## Purpose

MCP server wrapping the **Toggl Track API** (v9) and **Reports API** (v3) — time tracking, projects, clients, tags, workspaces, and reporting with 22 tools.

## Package Info

- **ID**: `toggl`
- **Name**: Toggl Track
- **Version**: 1.0.0
- **Requires API Key**: Yes (Toggl API token, Basic auth)

## Structure

```
toggl/
├── src/
│   ├── index.ts          # McpPackage export
│   ├── server.ts         # TogglMcpServer extends McpServer
│   ├── client.ts         # TogglClient — thin HTTP wrapper (Basic auth)
│   └── schemas.ts        # Zod input schemas for all 22 tools
├── __tests__/
│   ├── client.test.ts    # Client tests (mock global fetch)
│   └── server.test.ts    # Server tests (mock TogglClient)
├── package.json
├── tsconfig.json
└── AGENTS.md             # This file
```

## Tools Provided (22)

### User & Workspace
| Tool | Description |
|------|-------------|
| `toggl_me` | Get current user profile |
| `toggl_list_workspaces` | List all workspaces |
| `toggl_get_workspace` | Get workspace details |

### Time Entries
| Tool | Description |
|------|-------------|
| `toggl_list_time_entries` | List time entries (optional date range) |
| `toggl_get_current_time_entry` | Get running timer |
| `toggl_create_time_entry` | Create time entry or start timer |
| `toggl_update_time_entry` | Update time entry |
| `toggl_stop_time_entry` | Stop running timer |
| `toggl_delete_time_entry` | Delete time entry |

### Projects
| Tool | Description |
|------|-------------|
| `toggl_list_projects` | List workspace projects |
| `toggl_get_project` | Get project details |
| `toggl_create_project` | Create project |
| `toggl_update_project` | Update project |

### Clients
| Tool | Description |
|------|-------------|
| `toggl_list_clients` | List workspace clients |
| `toggl_create_client` | Create client |
| `toggl_update_client` | Update client |

### Tags
| Tool | Description |
|------|-------------|
| `toggl_list_tags` | List workspace tags |
| `toggl_create_tag` | Create tag |

### Reports
| Tool | Description |
|------|-------------|
| `toggl_report_summary` | Summary report (grouped by projects/clients/users) |
| `toggl_report_detailed` | Detailed report (individual entries) |
| `toggl_report_weekly` | Weekly time distribution report |
| `toggl_report_project_summary` | Project summary report |

## API Key Setup

1. Go to [Toggl Profile](https://track.toggl.com/profile)
2. Scroll to "API Token" section
3. Copy your token
4. In the UI: MCP Servers > Toggl Track > Configure API Key
5. Paste your token

**Auth**: HTTP Basic — `base64(apiToken:api_token)` → `Authorization: Basic {encoded}`

## Error Responses

| Error Code | Description |
|------------|-------------|
| `API_KEY_REQUIRED` | API token not configured |
| `INVALID_API_KEY` | Invalid or expired token (401/403) |
| `NOT_FOUND` | Resource not found (404) |
| `RATE_LIMITED` | Too many requests (429) — 1 req/sec limit |
| `BAD_REQUEST` | Invalid request parameters (400) |
| `API_ERROR` | Server error (5xx) |
| `INVALID_INPUT` | Zod input validation failed |
| `UNKNOWN_TOOL` | Unknown tool name |

## Seed Configuration

Automatically added to `default` profile:
- Order: 10
- Active: true

## Development

```bash
# Build
pnpm --filter @dxheroes/mcp-toggl build

# Test
pnpm --filter @dxheroes/mcp-toggl test

# Clean
pnpm --filter @dxheroes/mcp-toggl clean
```

## Dependencies

- `zod` - Input validation
- `@dxheroes/local-mcp-core` (peer) - Core abstractions

## Related Files

- **MCP Servers Guide**: `mcp-servers/AGENTS.md`
- **Core Types**: `packages/core/src/types/mcp-package.ts`
- **McpServer Base**: `packages/core/src/abstractions/McpServer.ts`
