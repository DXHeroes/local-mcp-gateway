# Profiles Module

## Description

Profile management module. Profiles are logical groupings of MCP servers that can be accessed via a single endpoint.

## Contents

- `profiles.module.ts` - Module definition
- `profiles.controller.ts` - REST API for profile CRUD
- `profiles.service.ts` - Profile business logic and tool aggregation

## Key Endpoints

- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create new profile
- `GET /api/profiles/:id` - Get profile details with MCP servers
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

## Key Concepts

- **Profile**: Named collection of MCP servers
- **Endpoint**: Each profile gets `/api/mcp/{slug}` endpoint
- **Tool Aggregation**: Combines tools from all servers in profile
- **AI Prompt**: Generates TOON/Markdown prompts for AI integration
- **Default Profile**: System creates "default" profile on first run

## Profile-MCP Relationship

- Profile has many MCP servers (many-to-many via ProfileMcpServer)
- Each assignment has order, enabled status, and tool filters
- Tools can be individually enabled/disabled per profile
