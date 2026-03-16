# AI Integration Guide

This guide explains how to integrate your Local MCP Gateway profiles with AI coding assistants like **Cursor** and **Claude Desktop**.

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
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "--url",
        "http://localhost:3001/api/mcp/my-profile/sse"
      ]
    }
  }
}
```

> **Tip:** If you encounter SSL errors, use an HTTPS tunnel URL (from `pnpm dev:https`) instead of `localhost`.

## 2. Providing Context to AI (The "AI Prompt")

Even when connected, the AI might not know *when* or *how* to use your specific tools. To solve this, the Local MCP Gateway provides generated **AI Prompts** in four formats.

### Available Formats

#### Recommended Format
Best balance of clarity and token efficiency:
- Good readability with compact representation
- Default choice for most use cases
- General-purpose AI integrations

#### Markdown Format
Human-readable format that's easy to review and understand:
- Clear headings and structured sections
- Standard Markdown formatting
- Best for documentation, debugging, and sharing with team members

#### XML Format
Structured format for precise tool definitions:
- Schema-like representation with XML tags
- Works well with AI models that understand XML structure
- Best for precise parameter definitions

#### TOON Format
**Token-Oriented Object Notation** - most compact format:
- Reduces token usage by 30-50% compared to JSON
- Minimizes hallucinations
- Best for token-limited contexts and production AI integrations

### How to Use

1.  Navigate to the **Profile** detail page in the frontend (`http://localhost:3000`).
2.  Click the **"AI Prompt"** tab on the profile card.
3.  Choose between **Recommended**, **Markdown**, **XML**, or **TOON** format using the tabs.
4.  Click the **Copy** button.
5.  **Paste** the copied text into your conversation with the AI.

### Example: Markdown Format

```markdown
# Profile: My Profile

**Endpoint:** https://blue-sky-42.loca.lt/api/mcp/my-profile

## Available Tools

### weather_tool
Get current weather

**Parameters:**
- `city` (string): The city name
```

### Example: TOON Format

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

### Which Format to Choose?

| Use Case | Recommended Format |
|----------|-------------------|
| General-purpose AI use | Recommended |
| Reviewing tool configurations | Markdown |
| Sharing with team members | Markdown |
| Debugging tool issues | Markdown |
| Precise schema definitions | XML |
| AI models that prefer XML | XML |
| Production AI integrations | TOON |
| Token-limited contexts | TOON |

### Benefits
- **Reduced Hallucinations**: The AI knows exactly what arguments are required.
- **Better Tool Selection**: The descriptions help the AI understand the tool's purpose.
- **Zero Configuration**: You don't need to manually explain your tools to the AI.
- **Format Choice**: Pick the format that best suits your needs.
