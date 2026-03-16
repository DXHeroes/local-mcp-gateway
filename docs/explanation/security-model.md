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
    - **Authentication**: All management API endpoints require an authenticated session. MCP proxy endpoints (`/api/mcp/...`) use the McpOAuthGuard which validates Bearer tokens or session cookies.
    - **Warning**: We explicitly warn users that this is a public tunnel. Do not share this URL.

### 2. Authentication and authorization

The gateway uses [Better Auth](https://www.better-auth.com/) for user authentication:

- **Email + password**: Enabled by default. Can be disabled via `AUTH_EMAIL_PASSWORD=false`.
- **Google OAuth**: Optional. Enabled when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- **Session management**: Cookie-based sessions with a configurable secret (`BETTER_AUTH_SECRET`). Sessions are cached for 5 minutes.
- **Bearer tokens**: MCP proxy endpoints accept `Authorization: Bearer <token>` headers for programmatic access.

#### Organization RBAC

Resources are scoped to organizations with role-based access control:

- **Owner**: Full control over the organization, its members, and all resources.
- **Admin**: Can manage servers, profiles, sharing, and invite members.
- **Member**: Can use shared servers and profiles.

#### Tool-level authentication

For connecting to backend MCP servers (not gateway user auth):

- **OAuth 2.1**: For third-party services (GitHub, Linear). Tokens are encrypted at rest.
- **API keys**: Stored encrypted in the database. Never returned to the client. Injected into headers after receiving the request from the AI.

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
4.  **Use organizations**: Group team resources in a shared organization with appropriate roles.
5.  **Protect your auth secret**: Set a strong `BETTER_AUTH_SECRET` in production to prevent session forgery.

