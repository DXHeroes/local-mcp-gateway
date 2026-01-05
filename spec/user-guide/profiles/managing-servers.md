# Managing Servers in Profiles

This guide covers how to add, remove, and organize MCP servers within profiles.

## Server Assignment

Servers must be assigned to profiles to be accessible. A server can be in:
- Zero profiles (unused)
- One profile (exclusive)
- Multiple profiles (shared)

---

## Adding Servers to a Profile

### Via Web UI

1. Go to **Profiles** page
2. Click **"Edit"** on the profile
3. Check the servers you want to add
4. Click **"Save"**

### Via API

```
POST /api/profiles/{profileId}/servers
```

```json
{
  "mcpServerId": "server-uuid-here",
  "order": 0
}
```

---

## Removing Servers from a Profile

### Via Web UI

1. Go to **Profiles** page
2. Click **"Edit"** on the profile
3. Uncheck servers to remove
4. Click **"Save"**

### Via API

```
DELETE /api/profiles/{profileId}/servers/{serverId}
```

---

## Server Ordering

The order of servers matters for:
- **Tool conflict resolution** - First server's tools take priority
- **Initialization order** - Servers initialize in order

### Setting Order

When adding a server, specify the order:

```json
{
  "mcpServerId": "server-uuid",
  "order": 0  // Lower = higher priority
}
```

### Reordering

To change order:
1. Remove server from profile
2. Re-add with new order value

Or update all orders:

```json
[
  { "mcpServerId": "github-id", "order": 0 },
  { "mcpServerId": "linear-id", "order": 1 },
  { "mcpServerId": "database-id", "order": 2 }
]
```

---

## Server Status in Profiles

### Viewing Status

On the profile card, you'll see:
- "3 of 3 servers connected" - All healthy
- "2 of 3 servers connected" - Some issues

### Status Meaning

| Status | Description |
|--------|-------------|
| Connected | Server responding, tools available |
| Disconnected | Server unreachable |
| Error | Server has configuration issues |

### Impact of Disconnected Servers

If a server is disconnected:
- Its tools won't appear in profile
- Tool calls to those tools will fail
- Other servers in profile still work

---

## Sharing Servers Across Profiles

A server can be in multiple profiles:

```
GitHub Server
├── In "development" profile
├── In "team" profile
└── In "all-tools" profile
```

### Benefits

- **No duplication** - Configure once, use everywhere
- **Consistent config** - Auth shared across profiles
- **Easy updates** - Update server, all profiles updated

### Considerations

- **OAuth tokens** - Stored per server, shared across profiles
- **Rate limits** - Shared across all profile usage
- **Debug logs** - Show which profile made request

---

## Tool Aggregation

When a profile has multiple servers, tools are aggregated:

```
development profile
├── GitHub server → 10 tools
├── Linear server → 8 tools
└── Database server → 5 tools
Total: 23 tools available
```

### Tool Discovery

When profile is accessed:
1. Gateway queries each server's tools
2. Tools are combined into single list
3. Conflicts are resolved (see below)
4. Full list returned to client

### Tool Conflicts

If two servers have a tool with the same name:

```
GitHub server: search
Docs server: search
```

Resolution: Later server's tool gets prefixed:

```
search → GitHub's search (first)
docs:search → Docs server's search (prefixed)
```

See [Tool Name Conflicts](../mcp-servers/tool-name-conflicts.md) for details.

---

## Bulk Operations

### Assigning Multiple Servers

In the UI, check multiple servers at once:
1. Edit profile
2. Check all desired servers
3. Save once

### Removing All Servers

1. Edit profile
2. Uncheck all servers
3. Save

Profile remains but has no tools.

---

## Server Recommendations

### By Profile Type

**Development Profile**:
- GitHub (code management)
- Database (dev/staging)
- Linear (project tracking)
- Documentation search

**Personal Profile**:
- Calendar
- Email
- Notes
- File system

**Production Profile**:
- Monitoring tools
- Database (read-only!)
- Alerting systems

### Server Count

| Servers | Use Case |
|---------|----------|
| 1-3 | Focused single use-case |
| 4-7 | Comprehensive workflow |
| 8+ | Consider splitting into multiple profiles |

Too many servers:
- Longer initialization
- More potential for conflicts
- Harder to manage

---

## Troubleshooting

### Server not appearing in list

1. Check server exists on MCP Servers page
2. Verify server is configured correctly
3. Refresh the profile edit page

### Server shows as disconnected

1. View server details for error message
2. Check server URL/configuration
3. Verify authentication

### Tools not appearing after adding server

1. Server might be disconnected
2. Server might have no tools
3. Try viewing server details to check tools

### Can't remove server

1. Check you have edit access
2. Try refreshing and editing again
3. Check backend logs for errors

---

## See Also

- [Creating Profiles](./creating-profiles.md) - Profile creation
- [Tool Name Conflicts](../mcp-servers/tool-name-conflicts.md) - Conflict resolution
- [MCP Servers](../mcp-servers/README.md) - Server configuration
