# Development Documentation

## Purpose

Documentation for contributors: setup, TDD workflow, contributing guidelines, code style, and testing.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - How-to guides instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Documentation directory instructions

## Files

- `setup.md` - Development environment setup
- `tdd-workflow.md` - How to write tests, TDD principles
- `contributing.md` - Contributing guidelines
  - Code style
  - Commit conventions
  - PR process
- `code-style.md` - Coding standards and conventions
- `testing.md` - Testing guide
  - Unit tests (Vitest)
  - Integration tests (MSW)
  - E2E tests (Playwright)
  - Coverage requirements
- `create-mcp-package.md` - How to create a new MCP package

## Tech Stack for Development

- **Backend**: NestJS 11.x with TypeScript
- **Database**: Prisma ORM with SQLite
- **Frontend**: React 19 with Vite
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: Biome
- **Build**: Turborepo

## Documentation Requirements

- Clear instructions for new contributors
- Code examples
- Best practices

## Target Audience

Developers contributing to the project.

## Related Files

- [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md) - Contributing guide
- [../../../vitest.config.ts](../../../vitest.config.ts) - Test configuration
- [../../../playwright.config.ts](../../../playwright.config.ts) - E2E test configuration

