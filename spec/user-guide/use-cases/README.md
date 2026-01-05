# Use Cases

This section presents real-world scenarios for using Local MCP Gateway. Each use case shows how to combine MCP servers to solve specific problems.

## Why Use Cases Matter

MCP servers are powerful individually, but the real value comes from **combining** them. Local MCP Gateway lets you:

- **Group related tools** by workflow
- **Switch contexts** by changing profiles
- **Share configurations** across teams
- **Debug interactions** in one place

---

## Available Use Cases

### [Personal AI Assistant](./personal-ai-assistant.md)

Set up Claude as your personal productivity assistant with access to:
- Calendar (Google Calendar, Outlook)
- Email (Gmail, Outlook)
- Notes and documents
- Local files

**Who it's for**: Individuals wanting Claude to help with daily tasks.

### [Development Workflow](./development-workflow.md)

Supercharge your coding workflow with:
- GitHub (issues, PRs, repositories)
- Linear (project management)
- Database access
- Documentation search

**Who it's for**: Developers wanting AI-assisted coding.

### [Team Collaboration](./team-collaboration.md)

Enable your team to share tools and configurations:
- Shared server credentials
- Consistent tool access
- Role-based profiles
- Centralized management

**Who it's for**: Teams wanting unified MCP access.

### [Debugging MCP Traffic](./debugging-mcp-traffic.md)

Understand and troubleshoot AI-tool communication:
- Request/response inspection
- Error diagnosis
- Performance monitoring
- Tool behavior analysis

**Who it's for**: Developers building or integrating MCP servers.

---

## Choosing the Right Use Case

| If you want to... | See |
|-------------------|-----|
| Use Claude for personal tasks | [Personal AI Assistant](./personal-ai-assistant.md) |
| Code faster with AI tools | [Development Workflow](./development-workflow.md) |
| Share MCP tools with your team | [Team Collaboration](./team-collaboration.md) |
| Debug MCP server issues | [Debugging MCP Traffic](./debugging-mcp-traffic.md) |
| Build custom MCP servers | [Debugging MCP Traffic](./debugging-mcp-traffic.md) |

---

## Profile Patterns

Common profile organization patterns:

### By Environment

```
├── development
│   ├── GitHub (staging)
│   ├── Database (dev)
│   └── Local servers
│
├── production
│   ├── GitHub (prod)
│   ├── Database (prod - read only)
│   └── Monitoring tools
```

### By Role

```
├── engineer
│   ├── GitHub
│   ├── Linear
│   ├── Database
│   └── Documentation
│
├── designer
│   ├── Figma
│   ├── Linear
│   └── Design system
│
├── manager
│   ├── Linear
│   ├── Analytics
│   └── Reporting
```

### By Task

```
├── coding
│   ├── GitHub
│   ├── Database
│   └── Documentation
│
├── communication
│   ├── Slack
│   ├── Email
│   └── Calendar
│
├── research
│   ├── Web search
│   ├── Documentation
│   └── Notes
```

---

## Getting Started

1. Read through the use cases that match your needs
2. Create profiles based on the patterns above
3. Add the recommended MCP servers
4. Configure your AI client (Claude Desktop, etc.)
5. Start using your tools!

---

## Contributing Use Cases

Have a use case to share? We welcome contributions:

1. Create a new file in this directory
2. Follow the existing format
3. Include step-by-step instructions
4. Submit a pull request

See [Contributing Guide](../../contributing/README.md) for details.
