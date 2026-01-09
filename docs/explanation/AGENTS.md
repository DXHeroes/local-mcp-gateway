# Documentation Explanation

## Purpose

Understanding-oriented deep dives. Focus on clarifying concepts and architectural decisions.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Documentation directory instructions

## Files

- `overview.md` - Architecture Overview (NestJS backend, React frontend)
- `mcp-discovery.md` - How MCP package auto-discovery works
- `security-model.md` - Explanation of security features (OAuth for MCP servers, API keys)

## Architecture Overview

- **Backend**: NestJS 11.x with modular architecture
- **Database**: Prisma ORM with SQLite
- **Frontend**: React 19 with Vite
- **MCP Packages**: Auto-discovered from `mcp-servers/`

## Target Audience

Users who want to understand "why" and "how" things work under the hood.
