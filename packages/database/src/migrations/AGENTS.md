# Database Migrations

## Purpose

Database schema migrations with versioning and rollback support.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Database package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Database package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `001_initial_schema.ts` - Initial database schema
  - Creates: profiles, mcp_servers, profile_mcp_servers, debug_logs, migrations tables
  - Up method: Creates all initial tables
  - Down method: Drops all tables
- `002_add_oauth_support.ts` - OAuth support migration
  - Creates: oauth_tokens, oauth_client_registrations tables
  - Adds oauth_config column to mcp_servers table
  - Up method: Adds OAuth tables and columns
  - Down method: Removes OAuth tables and columns
- `migration-runner.ts` - Migration execution system
  - Tracks executed migrations in migrations table
  - Executes migrations in transactions
  - Supports up and down operations
  - Auto-runs on application startup

## Development Rules

- Each migration must have unique number prefix
- Migrations must be reversible (up/down methods)
- Use transactions for atomicity
- Never modify existing migrations (create new ones instead)
- Test migrations in both directions

