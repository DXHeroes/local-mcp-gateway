# Security Model

Security is critical when exposing local tools to AI assistants. This document outlines the threat model and security measures in place.

## Threat Model

The primary risks we mitigate are:
1.  **Unauthorizated Access**: An external actor accessing your local MCP tools via the public tunnel.
2.  **Data Leakage**: Sensitive API keys or tokens being exposed in logs or prompts.
3.  **Injection Attacks**: Malicious tool arguments causing harm to the local system.

## Mitigation Strategies

### 1. Tunnel Security (HTTPS)
We use `localtunnel` to create a public HTTPS URL.
- **Risk**: The URL is public (`https://random-name.loca.lt`). Anyone with the URL can access your API.
- **Mitigation**:
    - **Obscurity**: The URL is random and temporary (unless you assign a subdomain).
    - **Authentication**: Currently, the gateway does **not** authenticate incoming requests. It relies on the secrecy of the tunnel URL.
    - **Warning**: We explicitly warn users that this is a public tunnel. Do not share this URL.

### 2. Authentication & Authorization
The Gateway supports two auth mechanisms for **connecting to backend tools** (not for protecting the gateway itself):

- **OAuth 2.1**: For connecting to third-party services (GitHub, Linear). Tokens are encrypted at rest.
- **API Keys**: Keys are stored encrypted in the SQLite database.
    - Keys are **never** returned to the client.
    - The Gateway injects them into headers *after* receiving the request from the AI.

### 3. Input Validation
- All requests are validated against Zod schemas.
- All tool inputs must match the JSON Schema defined by the MCP server.

### 4. Data Sanitization
- **Logs**: The `debug-logger` middleware automatically redacts known sensitive fields (headers, keys) before writing to the database or console.
- **Prompts**: The AI prompt generator (both Markdown and TOON formats) only includes metadata (names, descriptions), not actual data or keys.

## Best Practices for Users

1.  **Use unique profiles**: Don't put all your eggs in one basket.
2.  **Stop the tunnel**: Run `pnpm dev` (HTTP only) when you don't need the public URL.
3.  **Review logs**: Periodically check the "Debug Logs" page to ensure no unexpected access is occurring.

