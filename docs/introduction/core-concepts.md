# Core Concepts

Before diving in, it's helpful to understand the key concepts that power the Local MCP Proxy Server.

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
- **Custom**: TypeScript modules written directly in this project.

## 4. The Proxy
The **Proxy** is the brain of this application.
- It sits between the AI Client (Claude/Cursor) and your MCP Servers.
- It handles:
    - **Routing**: Directing requests to the correct server.
    - **Aggregation**: Combining lists of tools from multiple servers into one list for the AI.
    - **Security**: Managing OAuth tokens and API keys so you don't have to paste them into every chat.

## 5. Tunnels (HTTPS)
AI tools like **Claude Code** or **Claude Desktop** often require a **secure (HTTPS)** connection to work properly.
- Since your local server runs on `http://localhost`, we use a **Tunnel** (via `localtunnel`) to create a temporary public HTTPS URL (e.g., `https://blue-sky.loca.lt`) that routes traffic securely to your machine.

## 6. TOON (AI Prompt)
**Token-Oriented Object Notation (TOON)** is a data format optimized for LLMs.
- We use it to generate a "Context Prompt" that you can paste into your AI chat.
- It tells the AI: "Here are the tools available to you, and here is exactly how to use them."
- This significantly reduces hallucinations and improves tool use reliability.

