# Database Seeds

## Purpose

Seed data for onboarding new users with default profiles and example MCP servers.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Database package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Database package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `default-profiles.ts` - Default profiles seed data
  - "Default" profile with example MCP servers
  - "Development" profile for development
- `example-mcp-servers.ts` - Example MCP servers seed data
  - Linear MCP (with OAuth configuration)
  - File system MCP (local, no OAuth)
  - Web search MCP (example custom MCP)
- `seed-runner.ts` - Seed execution system
  - Runs seeds automatically on first startup
  - Checks if database is empty before seeding
  - Idempotent (safe to run multiple times)

## Development Rules

- Seeds should be idempotent
- Only seed if database is empty
- Include helpful examples for onboarding
- Document seed data in comments

