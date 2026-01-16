# OAuth Module

## Description

OAuth 2.1 authentication module for MCP servers. Handles authorization flows for MCP servers that require OAuth credentials.

## Contents

- `oauth.module.ts` - Module definition
- `oauth.controller.ts` - OAuth callback and token endpoints
- `oauth.service.ts` - OAuth flow management and token storage

## Key Endpoints

- `GET /api/oauth/authorize/:serverId` - Initiate OAuth flow
- `GET /api/oauth/callback` - OAuth callback handler
- `POST /api/oauth/refresh/:serverId` - Refresh access token

## Key Concepts

- **OAuth 2.1**: Modern OAuth with PKCE support
- **DCR**: Dynamic Client Registration for MCP servers
- **Token Storage**: Encrypted token storage in database
- **Auto-Refresh**: Automatic token refresh before expiry

## OAuth Flow

1. User initiates authorization for MCP server
2. Redirect to provider's authorization endpoint
3. Callback receives authorization code
4. Exchange code for access/refresh tokens
5. Store tokens for future MCP calls
