# Config Directory

## Description

Application configuration files using @nestjs/config. Provides type-safe configuration for the NestJS backend.

## Contents

- `app.config.ts` - General application configuration (port, environment)
- `database.config.ts` - Database/Prisma configuration (SQLite path)

## Key Concepts

- Configuration is loaded at application startup
- Uses environment variables with defaults
- Database path defaults to `~/.local-mcp-gateway-data/local-mcp-gateway.db`
- Configuration is injected via ConfigService
