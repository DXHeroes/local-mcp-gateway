# What is Local MCP Proxy?

The **Local MCP Proxy Server** is a power-user tool designed to bridge the gap between AI coding assistants (like Cursor and Claude Desktop) and your local or remote tools.

## The Problem
1.  **Fragmented Tools**: You have tools scattered everywhere—some are local CLIs, some are remote APIs, some require OAuth.
2.  **Context Switching**: You have to constantly manually paste API keys or context into your AI chats.
3.  **Connection Issues**: Tools like Claude Desktop require HTTPS, but your local dev server runs on HTTP.
4.  **"One Size Fits All"**: You can't easily switch between a "Work" context and a "Personal" context without reconfiguring your AI tool every time.

## The Solution
This application acts as a **smart middleware**:

1.  **Unified Interface**: It exposes a single standard MCP endpoint that aggregates multiple underlying servers.
2.  **Profile Management**: Create profiles like "Work", "Creative", or "Debug" and switch context instantly.
3.  **Auth Handling**: It handles OAuth flows (e.g., "Login with Linear") and securely stores API keys, injecting them into requests automatically.
4.  **Developer Experience**:
    - **HTTPS Tunnels**: One-click secure connection for Claude Code.
    - **TOON Prompts**: Copy-pasteable context that teaches the AI how to use your tools perfectly.
    - **Debug Logging**: See exactly what the AI is sending and receiving.

## Why use it?
- **For Developers**: Connect your local scripts and databases to Cursor seamlessly.
- **For Teams**: Share standard configurations for company tools.
- **For Power Users**: orchestrate complex workflows involving multiple APIs without the headache of manual auth management.

