# Profile Management

Profiles are the central concept in Local MCP Gateway. They group MCP servers together and expose them through a single endpoint.

## What is a Profile?

A profile is:

- **A named collection** of MCP servers
- **A single endpoint** for AI clients (`/api/mcp/{profile-name}`)
- **A way to organize tools** by use-case, environment, or team

---

## Why Use Profiles?

### Without Profiles

```
Claude Desktop Config:
├── GitHub server config
├── Linear server config
├── Database server config
├── Calendar server config
├── Email server config
└── ... more configs
```

Each AI client needs every server configured individually.

### With Profiles

```
Claude Desktop Config:
└── Gateway profile: development
    (internally has GitHub, Linear, Database)

Gateway manages:
├── development profile
│   ├── GitHub
│   ├── Linear
│   └── Database
├── personal profile
│   ├── Calendar
│   └── Email
└── team profile
    └── Shared tools
```

Configure once in gateway, use everywhere.

---

## Profile Features

| Feature | Description |
|---------|-------------|
| **Tool Aggregation** | All server tools accessible via one endpoint |
| **Conflict Resolution** | Handles duplicate tool names automatically |
| **Status Monitoring** | See which servers are connected |
| **Debug Logging** | Track all requests per profile |
| **AI Prompt Generation** | Generate tool descriptions for AI |

---

## Guides

### [Creating Profiles](./creating-profiles.md)

Step-by-step guide to creating and configuring profiles.

- Naming conventions
- Description best practices
- Initial server selection

### [Managing Servers](./managing-servers.md)

How to add and remove servers from profiles.

- Server assignment
- Server ordering
- Bulk operations

### [Profile Endpoints](./profile-endpoints.md)

Understanding the gateway endpoints for each profile.

- HTTP endpoint
- SSE endpoint
- Info endpoint

### [AI Prompt Generation](./ai-prompt-generation.md)

Generate prompts describing available tools.

- TOON format
- Prompt usage
- Customization

---

## Quick Reference

### Create Profile

```
Web UI → Profiles → Create Profile
```

### Profile Endpoint

```
http://localhost:3001/api/mcp/{profile-name}
```

### Add Server to Profile

```
Web UI → Profiles → Edit → Select servers → Save
```

### View Profile Tools

```
GET http://localhost:3001/api/mcp/{profile-name}/info
```

---

## See Also

- [Getting Started](../getting-started/quick-start.md) - First profile setup
- [MCP Servers](../mcp-servers/README.md) - Server configuration
- [Integration Guides](../integration/README.md) - Client configuration
