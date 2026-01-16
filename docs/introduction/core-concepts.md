# Core Concepts

Before diving in, it's helpful to understand the key concepts that power the Local MCP Gateway.

## 1. The MCP Protocol
The **Model Context Protocol (MCP)** is an open standard that allows AI models (like Claude) to interact with external tools and data. Think of it as a "USB port for AI" — a standard way to plug tools into an LLM.

## 2. Profiles
A **Profile** is a logical grouping of MCP servers.
- **Why?** You might have different contexts for different tasks.
    - *Work Profile*: Linear, GitHub, Slack.
    - *Personal Profile*: Weather, Spotify, Notes.
- **How it works**: Each profile gets a unique API endpoint (e.g., `/api/mcp/work`). When an AI connects to this endpoint, it sees *only* the tools assigned to that profile.

## 3. MCP Servers
These are the actual providers of tools and resources.
- **Remote HTTP/SSE**: Connect to an MCP server running elsewhere (or locally).
- **External (Stdio)**: Run a command (like `npx -y @modelcontextprotocol/server-memory`) and communicate via standard input/output.
- **Built-in Packages**: MCP server packages in `mcp-servers/` folder with auto-discovery.

## 4. The Gateway
The **Gateway** is the brain of this application.
- It sits between the AI Client (Claude/Cursor) and your MCP Servers.
- It handles:
    - **Routing**: Directing requests to the correct server.
    - **Aggregation**: Combining lists of tools from multiple servers into one list for the AI.
    - **Security**: Managing OAuth tokens and API keys so you don't have to paste them into every chat.

## 5. Tunnels (HTTPS)
AI tools like **Claude Code** or **Claude Desktop** often require a **secure (HTTPS)** connection to work properly.
- Since your local server runs on `http://localhost`, we use a **Tunnel** (via `localtunnel`) to create a temporary public HTTPS URL (e.g., `https://blue-sky.loca.lt`) that routes traffic securely to your machine.

## 6. AI Prompt Formats
The gateway provides AI-readable descriptions of your tools in two formats:

### Markdown Format
- **Human-readable** format that's easy to review and edit
- Best for documentation, debugging, and sharing with team members
- Standard Markdown with clear headings and bullet points

### TOON Format
- **Token-Oriented Object Notation** optimized for LLMs
- Reduces token usage by 30-50% compared to JSON
- Minimizes hallucinations and improves tool use reliability
- Best for production AI integrations where token efficiency matters

Both formats contain the same information: profile details, available tools, and their input schemas. Choose based on your use case - Markdown for readability, TOON for efficiency.

## 7. The Gateway Endpoint
The **Gateway Endpoint** (`/api/mcp/gateway`) is a unified endpoint that aggregates all tools from the default profile.
- **Simplified Configuration**: Connect once and get access to all your tools without managing multiple endpoints.
- **Default Profile**: The gateway uses the profile configured as "default" in Settings.
- **Full MCP Support**: Supports all MCP operations including tool listing, tool calls, resources, and prompts.

## 8. Streamable HTTP Transport
The gateway supports the **MCP specification 2025-11-25** with **Streamable HTTP** transport.
- **Server-Sent Events (SSE)**: Real-time notifications and streaming responses via `/api/mcp/gateway/sse`.
- **JSON-RPC 2.0**: Standard request/response via POST to `/api/mcp/gateway`.
- **Backward Compatible**: Works with both modern streaming clients and traditional request/response patterns.

