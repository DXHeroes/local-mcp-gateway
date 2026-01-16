# Backend Source Directory

## Description

Root source directory for the NestJS backend application. Contains the main entry point, app module, configuration, common utilities, and all feature modules.

## Contents

- `main.ts` - NestJS bootstrap and server initialization
- `app.module.ts` - Root module that imports all feature modules

## Subdirectories

- **[config/](config/AGENTS.md)** - Application and database configuration
- **[common/](common/AGENTS.md)** - Shared utilities (filters, interceptors, decorators, pipes)
- **[modules/](modules/AGENTS.md)** - Feature modules (mcp, profiles, proxy, oauth, etc.)

## Key Concepts

- NestJS follows modular architecture with dependency injection
- Each feature has its own module with controller, service, and DTOs
- Global modules (database) are imported in app.module.ts
- Configuration is loaded via @nestjs/config
