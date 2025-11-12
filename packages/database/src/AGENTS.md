# Database Package Source

## Purpose

Source code for database layer: migrations, seeds, and repositories.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Database package instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Packages directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Structure

```
src/
├── migrations/
│   ├── 001_initial_schema.ts
│   ├── 002_add_oauth_support.ts
│   └── migration-runner.ts
├── seeds/
│   ├── default-profiles.ts
│   ├── example-mcp-servers.ts
│   └── seed-runner.ts
├── repositories/
│   ├── ProfileRepository.ts
│   ├── McpServerRepository.ts
│   ├── DebugLogRepository.ts
│   ├── OAuthTokenRepository.ts
│   └── OAuthClientRegistrationRepository.ts
└── index.ts
```

## Files

### Migrations (`migrations/`)
- `001_initial_schema.ts` - Initial database schema (profiles, mcp_servers, profile_mcp_servers, debug_logs, migrations tables)
- `002_add_oauth_support.ts` - OAuth tables (oauth_tokens, oauth_client_registrations)
- `migration-runner.ts` - Migration execution system with up/down support

### Seeds (`seeds/`)
- `default-profiles.ts` - Default profiles for onboarding
- `example-mcp-servers.ts` - Example MCP servers (Linear, filesystem, etc.)
- `seed-runner.ts` - Seed execution system

### Repositories (`repositories/`)
- `ProfileRepository.ts` - Profile CRUD operations
- `McpServerRepository.ts` - MCP server management
- `DebugLogRepository.ts` - Debug logs storage and querying
- `OAuthTokenRepository.ts` - OAuth token management (encrypted storage)
- `OAuthClientRegistrationRepository.ts` - OAuth client registrations

### Entry Point
- `index.ts` - Exports all repositories and database utilities

## Development Rules

- **ALWAYS use prepared statements** - Never string concatenation
- All queries must be parameterized
- Input sanitization before database operations
- Transactions for multi-step operations
- Migrations must be reversible (up/down methods)

