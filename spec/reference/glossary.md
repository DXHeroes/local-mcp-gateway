# Glossary

This glossary defines key terms used throughout the Local MCP Gateway documentation.

---

## Core Concepts

### MCP (Model Context Protocol)

An open protocol developed by Anthropic that enables AI assistants to interact with external tools and data sources. MCP defines how AI models discover available tools, call them with arguments, and receive results.

**Related**: [MCP Specification](https://spec.modelcontextprotocol.io/)

### Profile

A named collection of MCP servers that are exposed through a single gateway endpoint. Profiles allow you to group tools by use-case (e.g., "development", "personal", "team") and switch between them easily.

**Example**: A "development" profile might include GitHub, Linear, and database servers.

### MCP Server

A service that implements the MCP protocol and provides tools and/or resources to AI assistants. Servers can be:

- **Remote HTTP** - Accessible via HTTP POST requests
- **Remote SSE** - Uses Server-Sent Events for streaming
- **External (Stdio)** - Local processes communicating via stdin/stdout
- **Custom** - TypeScript modules loaded dynamically

### Gateway Endpoint

The URL where a profile is accessible to MCP clients. Each profile has a unique endpoint based on its name.

**Format**: `/api/mcp/{profile-name}`

**Example**: `/api/mcp/development`

### Tool

A function that an MCP server exposes for AI to call. Tools have:

- **Name** - Unique identifier (e.g., `github_create_issue`)
- **Description** - What the tool does
- **Input Schema** - JSON Schema defining required parameters
- **Handler** - Code that executes when the tool is called

### Resource

Data that an MCP server exposes for AI to read. Resources have:

- **URI** - Unique identifier (e.g., `file:///path/to/document.md`)
- **Name** - Human-readable name
- **MIME Type** - Content type (e.g., `text/plain`, `application/json`)

---

## Authentication

### OAuth 2.1

A modern authorization framework used by many MCP servers. Local MCP Gateway supports OAuth 2.1 with PKCE for secure authentication without exposing client secrets.

### PKCE (Proof Key for Code Exchange)

A security extension to OAuth 2.0 that prevents authorization code interception attacks. PKCE generates a random `code_verifier` and its hash `code_challenge` to ensure the same client that started authorization completes it.

**Pronunciation**: "pixie"

### DCR (Dynamic Client Registration)

A mechanism (RFC 7591) that allows OAuth clients to register with authorization servers automatically. When an MCP server supports DCR, the gateway can obtain client credentials without manual configuration.

### API Key

A simple authentication method where a secret key is included in request headers. Less secure than OAuth but simpler to configure.

---

## Protocol & Communication

### JSON-RPC 2.0

The protocol used for MCP communication. Requests and responses are JSON objects with specific fields:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "github_create_issue", "arguments": {...} }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "content": [...] }
}
```

### SSE (Server-Sent Events)

A web technology for servers to push data to clients over HTTP. Some MCP servers use SSE for streaming responses or maintaining persistent connections.

### HTTP Transport

The standard MCP transport using HTTP POST requests. Each JSON-RPC request is sent as an HTTP POST with `Content-Type: application/json`.

### Stdio Transport

MCP transport using standard input/output streams. Used for local MCP servers that run as child processes.

---

## Architecture

### Monorepo

A repository containing multiple packages/projects. Local MCP Gateway uses a monorepo structure with Turborepo for orchestration.

### Turborepo

A build system for JavaScript/TypeScript monorepos that provides caching, parallel execution, and dependency management.

### Drizzle ORM

A TypeScript ORM (Object-Relational Mapping) used for database operations. Provides type-safe queries and schema definitions.

### Proxy Handler

The core component that aggregates multiple MCP servers behind a single interface. It routes requests to appropriate servers and combines their responses.

---

## UI & Tools

### Claude Desktop

Anthropic's desktop application for Claude that supports MCP connections. Configure it via `claude_desktop_config.json`.

### Claude Code

A CLI tool for using Claude in terminal environments. Supports MCP servers through configuration.

### Cursor IDE

An AI-powered code editor that supports MCP for tool integration. Configure it via project or global settings.

---

## Development

### Hot Reload

Automatic code reloading during development when files change. Both frontend and backend support hot reload.

### Vitest

A fast unit testing framework used for testing JavaScript/TypeScript code.

### Playwright

An end-to-end testing framework for web applications. Used for testing the web UI.

### Biome

A fast formatter and linter for JavaScript/TypeScript. Replaces ESLint and Prettier.

---

## Data

### SQLite

A lightweight, file-based SQL database used by Local MCP Gateway for persistence. Database file is stored at `~/.local-mcp-gateway-data/`.

### Migration

A database schema change tracked in code. Migrations ensure the database structure stays synchronized with the application.

### Seed Data

Default data inserted into the database during setup. Includes a system profile for internal operations.

---

## Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| API | Application Programming Interface |
| CLI | Command Line Interface |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| DCR | Dynamic Client Registration |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | HTTP Secure |
| IDE | Integrated Development Environment |
| JSON | JavaScript Object Notation |
| MCP | Model Context Protocol |
| OAuth | Open Authorization |
| ORM | Object-Relational Mapping |
| PKCE | Proof Key for Code Exchange |
| REST | Representational State Transfer |
| RPC | Remote Procedure Call |
| SPA | Single Page Application |
| SQL | Structured Query Language |
| SSE | Server-Sent Events |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| UI | User Interface |
| URI | Uniform Resource Identifier |
| URL | Uniform Resource Locator |
| UUID | Universally Unique Identifier |

---

## See Also

- [FAQ](./faq.md) - Frequently asked questions
- [Architecture Overview](../technical/architecture/system-overview.md) - System design
- [MCP Protocol](../technical/api/json-rpc-protocol.md) - Protocol details
