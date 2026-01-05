# Mandatory Engineering Practices (AI-Assisted, Language-Agnostic)

These rules guide Cursor's agent toward high-quality, low-friction workflows on any stack. You MUST follow these rules for every change you make.

## Core Principles — what to optimize for
- **Always understand the state of the codebase before making any changes.** Before writing any code, you must understand the current state of the codebase, read the documentation (README.md, AGENTS.md, etc.), code and understand the dependencies.
- **Match the specification.** Implement exactly what's asked. No extras, no "nice-to-haves," no speculative features.
- **KISS (Keep It Simple).** Prefer the simplest design and implementation that meets the spec. Avoid cleverness and premature abstraction/optimization.
- **YAGNI (You Aren't Gonna Need It).** Do not add speculative features or future-proofing unless explicitly required. Focus only on immediate requirements and deliverables. Minimise code bloat and long-term technical debt.
- **SOLID Principles.** Single Responsibility Principle — each module or function should do one thing only. Open-Closed Principle — software entities should be open for extension but closed for modification. Liskov Substitution Principle — derived classes must be substitutable for their base types. Interface Segregation Principle — prefer many specific interfaces over one general-purpose interface. Dependency Inversion Principle — depend on abstractions, not concrete implementations.
- **Single-task focus.** Work on **one** clearly defined change at a time. Don't start a second track before finishing the first.
- **Small, safe increments.** Make small changes, integrate early, and verify with automated checks.
- **TDD First.** This project follows Test-Driven Development. Write tests BEFORE implementation. Code coverage must be ≥90% before merging.

---

## Project-Specific Context

### Monorepo Structure
- **Package Manager**: pnpm 10.22.0+ (workspace protocol)
- **Build System**: Turborepo for monorepo orchestration
- **Workspaces**: `packages/*` and `apps/*`
- **Type System**: TypeScript strict mode (all packages)
- **Module System**: ES modules (`"type": "module"`)

### Testing Strategy
- **Approach**: TDD (Test-Driven Development) - write tests first
- **Unit/Integration**: Vitest with coverage thresholds (90% minimum)
- **E2E**: Playwright for end-to-end testing
- **Coverage Requirements**: Statements, branches, functions, lines all ≥90%
- **Test Locations**: 
  - Unit: `__tests__/unit/` or `*.test.ts` files
  - Integration: `__tests__/integration/` or `*.integration.test.ts` files
  - E2E: `apps/frontend/e2e/*.spec.ts`

### Code Quality
- **Linter/Formatter**: Biome (single quotes, semicolons, 2-space indent, 100 char width)
- **Type Checking**: TypeScript strict mode
- **Import Style**: Use `import type` for type-only imports (enforced)
- **Security**: All inputs validated with Zod, no `dangerouslySetInnerHtml`

### Key Terminology
- **MCP**: Model Context Protocol - protocol for AI assistants to access tools
- **Profile**: Named collection of MCP servers accessible via single endpoint
- **Tool**: Function that AI can call (e.g., `read_file`, `search_web`)
- **Gateway**: This application that aggregates multiple MCP servers

---

## Definition of Done (for each small change)
- ✅ Spec/acceptance criteria are satisfied (list them in the PR/commit).
- ✅ **Tests written FIRST** (TDD approach) and all tests pass.
- ✅ **Code coverage ≥90%** (statements, branches, functions, lines).
- ✅ Code compiles/builds; type checking passes.
- ✅ Code is **formatted** and **linted** with zero warnings (or documented exceptions).
- ✅ Minimal docs (e.g., README/CHANGELOG) updated *when relevant*.
- ✅ The change is self-reviewed before requesting human review.

---

## Run checks early and often
After meaningful edits (e.g., a new function or ~20–50 lines), **run** (or ask to run) in this order:
1) **Build/Compile**, 2) **Format**, 3) **Lint/Static analysis**, 4) **Type check**, 5) **Unit/quick tests**.

Keep the feedback loop **fast**. Prefer quick checks locally before full/test matrix in CI.

### Project-Specific Commands

```sh
# Setup (first time or after dependency changes)
pnpm install

# Build (compile all packages)
pnpm build
# Or build specific package/app:
pnpm --filter backend build
pnpm --filter frontend build

# Format (write changes)
pnpm format
# Or check formatting without changes:
pnpm format:check

# Lint (no auto-fix, shows errors)
pnpm lint
# Or lint specific package/app:
pnpm --filter backend lint
pnpm --filter frontend lint

# Type check (TypeScript validation)
pnpm typecheck
# Or type check specific package/app:
pnpm --filter backend typecheck
pnpm --filter frontend typecheck

# Fast tests (unit tests, quick feedback)
pnpm test:unit
# Or test specific package/app:
pnpm --filter backend test:unit
pnpm --filter frontend test:unit

# All tests (unit + integration)
pnpm test

# Test with coverage (must be ≥90%)
pnpm test:coverage

# E2E tests (slower, run before committing major features)
pnpm test:e2e

# Complete check (lint + typecheck + test + build)
pnpm check
```

### Quick Feedback Loop (Recommended Order)

For a small change (single function/component):
```sh
# 1. Build (ensure it compiles)
pnpm build

# 2. Format (auto-fix formatting)
pnpm format

# 3. Lint (check for issues)
pnpm lint

# 4. Type check (TypeScript validation)
pnpm typecheck

# 5. Run unit tests (fast feedback)
pnpm test:unit
```

For a larger change or before committing:
```sh
# Run complete check
pnpm check

# Verify coverage
pnpm test:coverage
```

---

## TDD Workflow (Test-Driven Development)

**This project REQUIRES TDD. Follow this order:**

1. **Write test first** - Create test file with failing test
2. **Run test** - Verify it fails (red)
3. **Implement feature** - Write minimal code to pass test
4. **Run test** - Verify it passes (green)
5. **Refactor** - Improve code while keeping tests green
6. **Check coverage** - Ensure ≥90% coverage

**Example:**
```typescript
// 1. Write test first (apps/backend/__tests__/unit/routes/my-feature.test.ts)
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';

describe('GET /api/my-feature', () => {
  it('should return 200 with data', async () => {
    const res = await request(app).get('/api/my-feature');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

// 2. Run test (should fail)
// pnpm --filter backend test:unit

// 3. Implement feature (apps/backend/src/routes/my-feature.ts)
// ... minimal implementation

// 4. Run test (should pass)
// pnpm --filter backend test:unit

// 5. Check coverage
// pnpm --filter backend test:coverage
```

---

## YAGNI (You Aren't Gonna Need It)
- **Do not add speculative features** or future-proofing unless explicitly required.
- **Focus only on immediate requirements and deliverables.**
- **Minimise code bloat and long-term technical debt.**
- **No "nice-to-have" features** unless explicitly requested.

---

## SOLID Principles

**Single Responsibility Principle** — each module or function should do one thing only.
- Handlers handle requests, routes define routes, middleware handles cross-cutting concerns
- Components render UI, pages compose components, utils provide pure functions

**Open-Closed Principle** — software entities should be open for extension but closed for modification.
- Use interfaces and abstractions from `packages/core/src/abstractions/`
- Extend via composition, not inheritance

**Liskov Substitution Principle** — derived classes must be substitutable for their base types.
- When implementing interfaces, maintain the contract

**Interface Segregation Principle** — prefer many specific interfaces over one general-purpose interface.
- See `packages/core/src/types/` for domain-specific types

**Dependency Inversion Principle** — depend on abstractions, not concrete implementations.
- Use workspace packages (`@dxheroes/local-mcp-*`) for shared code
- Inject dependencies rather than importing concrete implementations

---

## KISS in practice
- **Favor clarity over cleverness.** Readability beats micro-optimizations unless the spec demands performance.
- **Minimize moving parts.** Use the simplest data structures and APIs that meet the requirement.
- **Keep functions small and focused.** Low branching/nesting; extract helpers when it improves clarity.
- **Remove dead code & reduce configuration.** Delete unused paths, flags, and stubs that don't serve the spec.
- **Avoid speculative generality.** Don't add hooks/params "just in case."
- **Use existing patterns.** Follow the structure in `apps/backend/src/` and `apps/frontend/src/`.

---

## Match the specification precisely
- **Extract acceptance criteria** from the spec as a checklist (bullet points).
- **Trace work to criteria.** For each criterion, point to the file/function that fulfills it.
- **Resolve ambiguity minimally.** If the spec is unclear, choose the least-surprising behavior and note the assumption near the code/PR (keep scope small).
- **Check AGENTS.md** in relevant directories for specific guidelines.

---

## Single-task mode (no parallel tracks)
- Maintain a short **TODO list**, pick **one** item, and mark it as **CURRENT**.
- Do **not** open a second task until the current one reaches "Definition of Done."
- If a request mixes concerns, **split** it into small, sequential steps and finish them one-by-one.

---

## Suggested workflow for a small change

1. **Understand & restate** the spec as acceptance criteria. 
   - Read relevant `AGENTS.md` files (root, packages, apps)
   - Understand the codebase structure and dependencies
   - Check existing similar implementations

2. **Write test first** (TDD):
   - Create test file in appropriate location (`__tests__/unit/` or `__tests__/integration/`)
   - Write failing test that describes the desired behavior
   - Run test to confirm it fails

3. **Plan the minimal diff** (files to touch, simple approach):
   - Identify which packages/apps need changes
   - Check if shared code in `packages/` needs updates
   - Keep changes minimal and focused

4. **Implement** the change (small, readable commits):
   - Write minimal code to pass the test
   - Follow existing patterns and conventions
   - Use TypeScript strict mode
   - Use Zod for input validation

5. **Run checks** in order:
   ```sh
   pnpm build          # Compile
   pnpm format         # Format
   pnpm lint           # Lint
   pnpm typecheck      # Type check
   pnpm test:unit      # Unit tests
   ```

6. **Verify coverage**:
   ```sh
   pnpm test:coverage  # Must be ≥90%
   ```

7. **Self-review**: 
   - Remove noise, dead code, TODOs
   - Tighten names
   - Confirm KISS
   - Ensure all tests pass
   - Verify coverage ≥90%

8. **Document** only what's needed:
   - JSDoc comments for public APIs
   - Update README/CHANGELOG if user-facing
   - Update AGENTS.md if workflow changes

---

## Project-Specific Guidelines

### File Organization
- **Backend**: `apps/backend/src/`
  - `handlers/` - Business logic
  - `routes/` - Express route definitions
  - `middleware/` - Express middleware
  - `lib/` - Shared utilities

- **Frontend**: `apps/frontend/src/`
  - `components/` - React components
  - `pages/` - Page components (routes)
  - `lib/` - Shared utilities
  - `utils/` - Helper functions

- **Shared**: `packages/`
  - `core/` - Core abstractions and types
  - `database/` - Database layer
  - `config/` - Shared configuration
  - `ui/` - Shared UI components

### Naming Conventions
- **Components**: PascalCase (`MyComponent.tsx`)
- **Files**: kebab-case for non-components (`my-utils.ts`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `McpServer`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Import Style
- Use `import type` for type-only imports (enforced by Biome)
- Organize imports (auto-organized by Biome)
- Use workspace protocol for internal packages: `@dxheroes/local-mcp-*`

### Error Handling
- Use Zod for input validation
- Return appropriate HTTP status codes
- Log errors with Winston (backend)
- Display user-friendly error messages (frontend)

### Security
- **All inputs validated** with Zod schemas
- **SQL injection prevention**: Use Drizzle ORM (parameterized queries)
- **XSS prevention**: React auto-escapes, avoid `dangerouslySetInnerHtml`
- **Never commit secrets**: Use `.env` files (in `.gitignore`)

---

## Common Patterns

### Adding a New API Route
1. Write test in `apps/backend/__tests__/unit/routes/my-route.test.ts`
2. Create route file in `apps/backend/src/routes/my-route.ts`
3. Register route in `apps/backend/src/index.ts`
4. Add handler in `apps/backend/src/handlers/my-handler.ts` (if needed)
5. Run checks and verify coverage

### Adding a New React Component
1. Write test in `apps/frontend/src/__tests__/unit/MyComponent.test.tsx`
2. Create component in `apps/frontend/src/components/MyComponent.tsx`
3. Use TypeScript, follow existing component patterns
4. Run checks and verify coverage

### Working with Database
1. Create migration: `cd packages/database && pnpm drizzle-kit generate`
2. Review migration in `packages/database/src/migrations/`
3. Apply: `pnpm drizzle-kit migrate`
4. Update repository in `packages/database/src/repositories/`
5. Write tests for repository methods

---

## Before Committing

Run the complete check:
```sh
pnpm check
```

This runs:
- `pnpm lint` - Linting
- `pnpm typecheck` - Type checking
- `pnpm test` - All tests
- `pnpm build` - Build verification

Ensure:
- ✅ All tests pass
- ✅ Coverage ≥90%
- ✅ No linting errors
- ✅ Type checking passes
- ✅ Build succeeds
