# Database Package

## Purpose

This package provides the SQLite database layer with migrations, seeds, and repository pattern for all database operations.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
database/
├── src/
│   ├── migrations/
│   │   ├── 001_initial_schema.ts
│   │   ├── 002_add_oauth_support.ts
│   │   └── migration-runner.ts
│   ├── seeds/
│   │   ├── default-profiles.ts
│   │   ├── example-mcp-servers.ts
│   │   └── seed-runner.ts
│   ├── repositories/
│   │   ├── ProfileRepository.ts
│   │   ├── McpServerRepository.ts
│   │   ├── DebugLogRepository.ts
│   │   ├── OAuthTokenRepository.ts
│   │   └── OAuthClientRegistrationRepository.ts
│   └── index.ts
├── __tests__/
│   ├── unit/                    # Repository unit tests
│   └── integration/             # Database integration tests
├── package.json
└── tsconfig.json
```

## Key Files

### Migrations
- `src/migrations/001_initial_schema.ts` - Initial database schema
- `src/migrations/002_add_oauth_support.ts` - OAuth tables migration
- `src/migrations/migration-runner.ts` - Migration execution system

### Seeds
- `src/seeds/default-profiles.ts` - Default profiles for onboarding
- `src/seeds/example-mcp-servers.ts` - Example MCP servers (Linear, etc.)
- `src/seeds/seed-runner.ts` - Seed execution system

### Repositories
- `src/repositories/ProfileRepository.ts` - Profile CRUD operations
- `src/repositories/McpServerRepository.ts` - MCP server management
- `src/repositories/DebugLogRepository.ts` - Debug logs storage
- `src/repositories/OAuthTokenRepository.ts` - OAuth token management
- `src/repositories/OAuthClientRegistrationRepository.ts` - OAuth client registrations

## Database Schema

See: [../../docs/architecture/database-schema.md](../../docs/architecture/database-schema.md)

Tables:
- `profiles` - User profiles
- `mcp_servers` - MCP server configurations
- `profile_mcp_servers` - Profile-MCP server relationships
- `oauth_tokens` - OAuth access/refresh tokens
- `oauth_client_registrations` - OAuth client registrations
- `debug_logs` - Debug logging
- `migrations` - Migration tracking

## Dependencies

- `better-sqlite3` - SQLite driver
- `zod` - Input validation
- `@local-mcp/core` - For types

## Development Rules

- **ALWAYS use prepared statements** - Never string concatenation
- All queries must be parameterized
- Input sanitization before database operations
- Transactions for multi-step operations
- Repository pattern - no direct database access outside repositories
- Migrations must be reversible (up/down methods)
- Seeds run automatically on first startup

## Security Requirements

- SQL injection prevention (prepared statements)
- Input validation with zod before database operations
- Secure file permissions (600) for SQLite database
- Encrypted storage for sensitive data (OAuth tokens, API keys)

## Testing Requirements

- Unit tests with mocked database
- Integration tests with real SQLite test database
- Test migrations (up and down)
- Test seeds
- Coverage: ≥90%

## Usage Example

```typescript
import { ProfileRepository } from '@local-mcp/database';

const repo = new ProfileRepository(db);
const profile = await repo.create({
  name: 'my-profile',
  description: 'My first profile'
});
```

