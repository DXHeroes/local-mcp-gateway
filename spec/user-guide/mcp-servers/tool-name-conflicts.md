# Tool Name Conflicts

When multiple MCP servers have tools with the same name, the gateway resolves conflicts through automatic prefixing.

## The Problem

Consider two servers:

```
GitHub Server:
- search
- create_issue

Documentation Server:
- search
- get_page
```

Both have a `search` tool. Which one should Claude use?

---

## How Conflicts Are Resolved

### Detection

When aggregating tools from multiple servers, the gateway:
1. Collects all tools from all servers
2. Tracks tool names seen
3. Detects when a name appears twice

### Resolution: Prefixing

Conflicting tools get prefixed with their server ID:

```
Before:
├── GitHub: search, create_issue
└── Docs: search, get_page

After (aggregated):
├── search (GitHub's - first takes priority)
├── create_issue
├── docs:search (prefixed - conflict)
└── get_page
```

### Priority Order

The first server to register a tool name wins:
- Server order in profile determines priority
- Earlier servers get unprefixed names
- Later servers get prefixed names

---

## Prefix Format

### Format

```
{server-id}:{tool-name}
```

### Examples

| Original Name | Server | Resulting Name |
|---------------|--------|----------------|
| search | GitHub (first) | search |
| search | Docs (second) | docs:search |
| create | API (first) | create |
| create | Admin (third) | admin:create |

---

## Using Prefixed Tools

### In Claude

Claude can call prefixed tools directly:

```
Use docs:search to find information about authentication
```

Or Claude may figure out which tool to use based on context:

```
Search the documentation for authentication
(Claude picks docs:search)
```

### In API Calls

```json
{
  "method": "tools/call",
  "params": {
    "name": "docs:search",
    "arguments": {
      "query": "authentication"
    }
  }
}
```

---

## Controlling Priority

### Server Order

To control which server's tools take priority:

1. Edit profile
2. Arrange servers in desired order
3. Save

Server order affects:
- Which server gets unprefixed names
- Initialization order

### Example: Prioritize GitHub

```
Profile: development
├── 1. GitHub (search → unprefixed)
├── 2. Documentation (search → docs:search)
└── 3. Database
```

### Example: Prioritize Documentation

```
Profile: development
├── 1. Documentation (search → unprefixed)
├── 2. GitHub (search → github:search)
└── 3. Database
```

---

## Viewing Conflicts

### In Server Details

Server detail page shows all tools without prefix context.

### In Profile Info

```bash
curl http://localhost:3001/api/mcp/my-profile/info | jq '.tools[].name'
```

Shows final tool names including prefixes.

### In Debug Logs

Tool calls show the actual tool name used:

```json
{
  "params": {
    "name": "docs:search"
  }
}
```

---

## Avoiding Conflicts

### Naming Conventions

Encourage MCP servers to use unique prefixes:

```
Instead of:
- search
- create
- list

Use:
- github_search
- github_create_issue
- github_list_repos
```

### Profile Organization

Create focused profiles with non-overlapping servers:

```
coding-profile:
├── GitHub
└── Database

research-profile:
├── Documentation
└── Web Search
```

### Server Selection

If two servers have overlapping functionality, choose one:

```
Either:
- GitHub's search
OR
- Documentation's search

Not both in same profile
```

---

## Edge Cases

### Same Server, Same Tool

Not possible - servers have unique tool names.

### All Tools Conflict

If every tool name conflicts:

```
Server A: search, list, create
Server B: search, list, create

Result:
├── search
├── list
├── create
├── serverb:search
├── serverb:list
└── serverb:create
```

### Three-Way Conflict

```
Server A: search (order 1)
Server B: search (order 2)
Server C: search (order 3)

Result:
├── search (Server A)
├── serverb:search
└── serverc:search
```

---

## Best Practices

### For Profile Creators

1. **Review tool lists** before combining servers
2. **Order strategically** - most important server first
3. **Use focused profiles** - fewer conflicts
4. **Document prefixes** - help users understand

### For MCP Server Developers

1. **Use unique tool names** - include service prefix
2. **Avoid generic names** - `search` → `github_search`
3. **Be consistent** - same prefix for all tools
4. **Document tool names** - clear naming scheme

---

## Troubleshooting

### "Tool not found"

If a tool call fails:
1. Check exact tool name (with prefix if needed)
2. Verify tool exists in profile
3. Check server is connected

### Wrong tool called

If the wrong search is being used:
1. Check server order in profile
2. Use explicit prefix: `docs:search`
3. Reorder servers if needed

### Prefix not working

1. Verify server ID matches prefix
2. Check colon syntax: `server:tool`
3. Ensure tool exists on that server

---

## See Also

- [Managing Servers](../profiles/managing-servers.md) - Server ordering
- [Profile Endpoints](../profiles/profile-endpoints.md) - Viewing tools
- [Debug Logs](../web-ui/debug-logs-page.md) - Inspecting tool calls
