# Tests Directory

## Description

Frontend unit and integration tests using Vitest.

## Contents

- `unit/` - Unit tests for components and utilities
- `vitest.d.ts` - Vitest type declarations

## Key Concepts

- **Vitest**: Fast unit test framework compatible with Jest API
- **Testing Library**: Uses @testing-library/react for component tests
- **MSW**: Mock Service Worker for API mocking (when needed)
- **Router Context**: Wrap components using navigation in `<MemoryRouter>`

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```
