# AI Integration Guide

This guide explains how to integrate your Local MCP Proxy Server profiles with AI coding assistants like **Cursor** and **Claude Desktop**.

## 1. Connecting to MCP Clients

### Prerequisites

AI tools (like Claude Desktop or Cursor) connect to your MCP server to discover and use tools.

- **Local Connection**: Works for tools running on your machine that support HTTP.
- **HTTPS Connection**: Required for some tools (like Claude Desktop) or when connecting from a different network.

### Connection Methods

#### A. Local HTTP (Standard)
Use this for standard local development if your client supports plain HTTP.

**URL**: `http://localhost:3001/api/mcp/<profile-name>`

#### B. Public HTTPS Tunnel (Recommended)
Use this if you encounter SSL certificate errors or need a public URL. We use `localtunnel` to create a secure tunnel.

1.  Start the HTTPS dev server:
    ```bash
    pnpm dev:https
    ```
2.  Copy the URL displayed in the terminal (e.g., `https://blue-sky-42.loca.lt`).
3.  Construct your endpoint: `https://blue-sky-42.loca.lt/api/mcp/<profile-name>`

### Configuration Examples

#### Cursor (`mcp.json`)

```json
{
  "mcpServers": {
    "My Profile": {
      "type": "http",
      "url": "https://blue-sky-42.loca.lt/api/mcp/my-profile"
    }
  }
}
```

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "My Profile": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sse", "--url", "https://blue-sky-42.loca.lt/api/mcp/my-profile/sse"]
    }
  }
}
```
*(Note: For Claude Desktop, using the SSE endpoint is often preferred).*

## 2. Providing Context to AI (The "AI Prompt")

Even when connected, the AI might not know *when* or *how* to use your specific tools. To solve this, the Local MCP Proxy Server provides a generated **AI Prompt**.

### What is it?
It's a specially formatted text block using **TOON (Token-Oriented Object Notation)**. It describes:
- The profile name and URL.
- Every available tool.
- The input schema for each tool.

TOON is optimized for LLMs to be token-efficient and highly readable.

### How to use it

1.  Navigate to the **Profile** detail page in the frontend (`http://localhost:3000`).
2.  Locate the **"AI Prompt"** section on the profile card.
3.  Click the arrow to expand it (optional) or directly click the **Copy** button.
4.  **Paste** the copied text into your conversation with the AI.

### Example Prompt

```toon
data{profile,url,tools}:
  "My Profile","https://blue-sky-42.loca.lt/api/mcp/my-profile",[
    {
      "name": "weather_tool",
      "description": "Get current weather",
      "input_schema": { "type": "object", "properties": { "city": { "type": "string" } } }
    }
  ]
```

### Benefits
- **Reduced Hallucinations**: The AI knows exactly what arguments are required.
- **Better Tool Selection**: The descriptions help the AI understand the tool's purpose.
- **Zero Configuration**: You don't need to manually explain your tools to the AI.
