# Root Directory - Local MCP Proxy Server

## Purpose

This is the root directory of the Local MCP Proxy Server monorepo. This application serves as a local MCP proxy server that allows adding external MCP servers and creating custom MCP implementations.

## Project Structure

This is a **pnpm workspace + Turborepo** monorepo with the following structure:

```
# Local MCP Gateway/
├── packages/          # Shared packages
├── apps/              # Applications (backend, frontend)
├── custom-mcps/        # User-created custom MCP servers
├── docs/              # Documentation
└── [root config files]
```

## Key Principles

1. **TDD First**: All code must have tests before implementation (90% coverage minimum)
2. **Documentation**: All code must be documented (JSDoc, guides, examples)
3. **Security**: All inputs validated, SQL injection prevention, XSS prevention
4. **Type Safety**: Full TypeScript strict mode
5. **Hot Reload**: Both backend and frontend support hot-reload in dev mode

## Development Workflow

- `pnpm dev` - Start both backend and frontend with hot-reload
- `pnpm test` - Run all tests
- `pnpm test:coverage` - Run tests with coverage (must be ≥90%)
- `pnpm build` - Build all packages
- `pnpm docker:up` - Start Docker containers

## Child Directories

Each directory has its own `AGENTS.md` with specific instructions:

- **[packages/AGENTS.md](packages/AGENTS.md)** - Shared packages overview
- **[apps/AGENTS.md](apps/AGENTS.md)** - Applications (backend, frontend)
- **[custom-mcps/AGENTS.md](custom-mcps/AGENTS.md)** - Custom MCP servers
- **[docs/AGENTS.md](docs/AGENTS.md)** - Documentation structure

## Root Configuration Files

- `package.json` - Root package.json with workspace scripts
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `turbo.json` - Turborepo pipeline configuration
- `vitest.config.ts` - Vitest configuration for unit/integration tests
- `playwright.config.ts` - Playwright configuration for E2E tests
- `biome.json` - Biome linting and formatting configuration
- `docker-compose.yml` - Docker Compose configuration
- `.env.example` - Environment variables template
- `README.md` - Main project README
- `CONTRIBUTING.md` - Contributing guidelines

## Implementation Plans

This project follows detailed implementation plans:

- **[.cursor/plans/local-mcp-proxy-server-ece204be.plan.md](.cursor/plans/local-mcp-proxy-server-ece204be.plan.md)** - Main implementation plan with architecture, database schema, OAuth 2.1 implementation, and all phases
- **[.cursor/plans/dokon-en-local-mcp-proxy-server.plan.md](.cursor/plans/dokon-en-local-mcp-proxy-server.plan.md)** - Completion plan with remaining tasks and priorities

## Important Notes

- Always follow TDD: Write tests first, then implement
- Code coverage must be ≥90% before merging
- All public APIs must have JSDoc comments
- Documentation must be updated with code changes
- Security validations are mandatory for all inputs
- Refer to implementation plans for detailed requirements and architecture decisions

