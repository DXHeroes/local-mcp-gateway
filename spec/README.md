# Local MCP Gateway Documentation

> **Version**: 0.1.0
> **Status**: In Development

Local MCP Gateway is an **MCP (Model Context Protocol) server aggregator** that combines multiple MCP servers into unified **profiles**, exposing them through a single endpoint. Instead of configuring individual MCP servers in your AI tools, you configure one gateway endpoint that provides access to all your tools.

## Why Local MCP Gateway?

Traditional MCP setup requires configuring each server individually in every AI client. This leads to:

- **Configuration sprawl** - Same servers configured multiple times
- **No use-case grouping** - Can't easily switch between tool sets
- **Complex authentication** - Managing OAuth/API keys per server per client
- **No visibility** - Hard to debug what's happening between AI and tools

Local MCP Gateway solves this by:

- **Aggregating servers** into profiles (e.g., "development", "personal", "team")
- **Single endpoint** per profile for all AI clients
- **Centralized auth** - OAuth and API keys managed in one place
- **Debug logging** - Full visibility into MCP traffic

## Quick Links

### Getting Started

- [Quick Start Guide](./user-guide/getting-started/quick-start.md) - Get running in 5 minutes
- [Installation](./user-guide/getting-started/installation.md) - Detailed setup instructions
- [Your First Profile](./user-guide/getting-started/first-profile.md) - Create your first profile
- [Adding MCP Servers](./user-guide/getting-started/first-mcp-server.md) - Connect your first server

### Use Cases

- [Personal AI Assistant](./user-guide/use-cases/personal-ai-assistant.md) - Calendar, email, files
- [Development Workflow](./user-guide/use-cases/development-workflow.md) - GitHub, Linear, databases
- [Team Collaboration](./user-guide/use-cases/team-collaboration.md) - Shared tool access
- [Debugging MCP Traffic](./user-guide/use-cases/debugging-mcp-traffic.md) - Inspect AI-tool communication

### Integration

- [Claude Desktop](./user-guide/integration/claude-desktop.md) - Setup for Claude Desktop
- [Claude Code CLI](./user-guide/integration/claude-code.md) - Setup for Claude Code
- [Cursor IDE](./user-guide/integration/cursor-ide.md) - Setup for Cursor

### Business & Licensing

- [Business Overview](./business/README.md) - Business model and monetization
- [Licensing Model](./business/licensing/license-model.md) - Dual licensing (source-available + commercial)
- [Pricing Tiers](./business/pricing/pricing-tiers.md) - Cloud SaaS and self-hosted pricing
- [Feature Matrix](./business/pricing/feature-matrix.md) - Feature comparison by tier

### Technical Reference

- [Architecture Overview](./technical/architecture/system-overview.md)
- [REST API Reference](./technical/api/rest-api.md)
- [Database Schema](./technical/database/schema.md)
- [Configuration Reference](./technical/configuration/environment-variables.md)
- [Monetization Architecture](./technical/monetization/README.md) - Payments, licensing, usage metering

### Support

- [Glossary](./reference/glossary.md) - Key terms and concepts
- [FAQ](./reference/faq.md) - Frequently asked questions
- [Troubleshooting](./reference/troubleshooting.md) - Common issues and solutions

---

## Documentation Structure

```
spec/
├── user-guide/           # For all users
│   ├── getting-started/  # Installation and first steps
│   ├── use-cases/        # Real-world scenarios
│   ├── web-ui/           # Web interface guides
│   ├── profiles/         # Profile management
│   ├── mcp-servers/      # Server configuration
│   ├── authentication/   # OAuth and API keys
│   └── integration/      # Client setup guides
│
├── business/             # Business & licensing
│   ├── licensing/        # License model and terms
│   ├── pricing/          # Pricing tiers and features
│   └── customers/        # Customer segments
│
├── technical/            # For developers
│   ├── architecture/     # System design
│   ├── api/              # API reference
│   ├── database/         # Schema reference
│   ├── core/             # Core package docs
│   ├── packages/         # Package documentation
│   ├── configuration/    # Config reference
│   ├── deployment/       # Deployment guides
│   └── monetization/     # Payments & licensing tech
│       ├── database/     # Users, subscriptions, licenses
│       ├── api/          # Billing & license APIs
│       ├── payments/     # Payment provider integration
│       └── licensing/    # Key generation & validation
│
├── reference/            # Quick reference
│   ├── glossary.md       # Terminology
│   ├── faq.md            # Common questions
│   ├── troubleshooting.md
│   └── error-codes.md
│
└── contributing/         # For contributors
    ├── development-setup.md
    ├── testing-guide.md
    └── code-style.md
```

---

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- A compatible MCP client (Claude Desktop, Claude Code, Cursor, etc.)

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Profile** | A named collection of MCP servers exposed through a single endpoint |
| **MCP Server** | A service providing tools and resources via the MCP protocol |
| **Gateway Endpoint** | The URL where a profile is accessible (e.g., `/api/mcp/my-profile`) |
| **Tool** | A function that AI can call to perform actions |
| **Resource** | Data that AI can read (files, database records, etc.) |

See the [Glossary](./reference/glossary.md) for complete terminology.

---

## Architecture at a Glance

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│  Claude Desktop │     │        Local MCP Gateway             │
│  Claude Code    │────▶│  ┌─────────┐    ┌─────────────────┐  │
│  Cursor IDE     │     │  │ Profile │───▶│ MCP Server 1    │  │
└─────────────────┘     │  │ "dev"   │    │ (GitHub)        │  │
                        │  │         │───▶│ MCP Server 2    │  │
        HTTP/SSE        │  │         │    │ (Linear)        │  │
     /api/mcp/dev       │  │         │───▶│ MCP Server 3    │  │
                        │  └─────────┘    │ (Database)      │  │
                        │                 └─────────────────┘  │
                        └──────────────────────────────────────┘
```

The gateway aggregates tools from multiple servers and presents them as a unified interface. When Claude calls a tool, the gateway routes it to the correct server.

---

## License

Local MCP Gateway uses a **dual licensing model**:

- **Source-Available License** - Free for personal and non-commercial use
- **Commercial License** - Required for business and commercial deployments

See [Licensing Model](./business/licensing/license-model.md) for details.
