# Testing Guide

Guide for testing Local MCP Gateway.

## Overview

Local MCP Gateway uses Vitest for unit and integration tests, and Playwright for E2E tests.

---

## Test Structure

```
├── packages/
│   ├── core/
│   │   └── __tests__/
│   │       ├── unit/
│   │       └── integration/
│   └── database/
│       └── __tests__/
├── apps/
│   ├── backend/
│   │   └── __tests__/
│   └── frontend/
│       └── __tests__/
└── e2e/
    └── tests/
```

---

## Running Tests

### All Tests

```bash
pnpm test
```

### Unit Tests

```bash
pnpm test:unit
```

### Integration Tests

```bash
pnpm test:integration
```

### E2E Tests

```bash
pnpm test:e2e
```

### Watch Mode

```bash
pnpm test:watch
```

### With Coverage

```bash
pnpm test:coverage
```

---

## Test Types

### Unit Tests

Test individual functions and classes in isolation.

```typescript
// packages/core/__tests__/unit/McpServerFactory.test.ts
import { describe, it, expect } from 'vitest';
import { McpServerFactory } from '../../src/factories/McpServerFactory';

describe('McpServerFactory', () => {
  it('creates RemoteHttpMcpServer for remote_http type', () => {
    const config = {
      id: 'test-id',
      name: 'Test Server',
      type: 'remote_http' as const,
      config: { url: 'https://example.com/mcp' }
    };

    const server = McpServerFactory.create(config);

    expect(server).toBeInstanceOf(RemoteHttpMcpServer);
  });

  it('throws for unknown server type', () => {
    const config = {
      id: 'test-id',
      name: 'Test Server',
      type: 'unknown' as any,
      config: {}
    };

    expect(() => McpServerFactory.create(config)).toThrow('Unknown server type');
  });
});
```

### Integration Tests

Test component interactions.

```typescript
// packages/database/__tests__/integration/profiles.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../helpers/db';
import { profiles } from '../../src/schema';

describe('Profiles Database Operations', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await db.migrate();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it('creates a profile', async () => {
    const result = await db.insert(profiles).values({
      name: 'Test Profile',
      slug: 'test-profile'
    }).returning();

    expect(result[0]).toMatchObject({
      name: 'Test Profile',
      slug: 'test-profile'
    });
  });

  it('enforces unique slug constraint', async () => {
    await db.insert(profiles).values({
      name: 'Profile 1',
      slug: 'unique-slug'
    });

    await expect(
      db.insert(profiles).values({
        name: 'Profile 2',
        slug: 'unique-slug'
      })
    ).rejects.toThrow();
  });
});
```

### API Tests

Test REST API endpoints.

```typescript
// apps/backend/__tests__/integration/api/profiles.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../helpers/app';

describe('Profiles API', () => {
  let app: Express.Application;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/profiles', () => {
    it('returns empty array initially', async () => {
      const response = await request(app)
        .get('/api/profiles')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/profiles', () => {
    it('creates a new profile', async () => {
      const response = await request(app)
        .post('/api/profiles')
        .send({ name: 'Test', slug: 'test' })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test',
        slug: 'test'
      });
    });

    it('rejects duplicate slug', async () => {
      await request(app)
        .post('/api/profiles')
        .send({ name: 'Test 1', slug: 'duplicate' });

      await request(app)
        .post('/api/profiles')
        .send({ name: 'Test 2', slug: 'duplicate' })
        .expect(409);
    });
  });
});
```

### E2E Tests

Test full user workflows.

```typescript
// e2e/tests/profiles.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test('creates a new profile', async ({ page }) => {
    await page.goto('/');

    // Click add profile button
    await page.click('[data-testid="add-profile-button"]');

    // Fill form
    await page.fill('[data-testid="profile-name-input"]', 'My Profile');
    await page.fill('[data-testid="profile-slug-input"]', 'my-profile');

    // Submit
    await page.click('[data-testid="create-profile-button"]');

    // Verify profile appears
    await expect(page.locator('text=My Profile')).toBeVisible();
  });

  test('adds server to profile', async ({ page }) => {
    // Create profile first
    await createProfile(page, 'Test Profile', 'test-profile');

    // Navigate to profile
    await page.click('text=Test Profile');

    // Add server
    await page.click('[data-testid="add-server-button"]');
    await page.selectOption('[data-testid="server-select"]', 'server-id');
    await page.click('[data-testid="confirm-add-server"]');

    // Verify server appears
    await expect(page.locator('[data-testid="server-list"]')).toContainText('Server Name');
  });
});
```

---

## Test Helpers

### Test Database

```typescript
// __tests__/helpers/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/schema';

export function createTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });

  return {
    ...db,
    async migrate() {
      // Run migrations
    },
    async cleanup() {
      sqlite.close();
    }
  };
}
```

### Test App

```typescript
// __tests__/helpers/app.ts
import express from 'express';
import { createTestDb } from './db';

export async function createTestApp() {
  const db = createTestDb();
  await db.migrate();

  const app = express();
  // Setup routes with test db

  return {
    ...app,
    async close() {
      await db.cleanup();
    }
  };
}
```

### Mock MCP Server

```typescript
// __tests__/helpers/mockMcpServer.ts
export function createMockMcpServer() {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue([
      { name: 'test_tool', description: 'Test tool' }
    ]),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Result' }]
    }),
    disconnect: vi.fn().mockResolvedValue(undefined)
  };
}
```

---

## Mocking

### Mock HTTP Responses

```typescript
import { vi } from 'vitest';

vi.mock('node-fetch', () => ({
  default: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked' })
  })
}));
```

### Mock OAuth

```typescript
const mockOAuthManager = {
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  refreshToken: vi.fn().mockResolvedValue(undefined),
  storeTokens: vi.fn().mockResolvedValue(undefined)
};
```

---

## Coverage

### View Coverage Report

```bash
pnpm test:coverage
open coverage/index.html
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default {
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
};
```

---

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### Do

- Write tests for new features
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests independent
- Clean up test data

### Don't

- Test implementation details
- Write flaky tests
- Skip tests without reason
- Ignore test failures
- Mock too much

---

## See Also

- [Development Setup](./development-setup.md) - Dev environment
- [Code Style](./code-style.md) - Coding standards
- [Pull Request Process](./pull-request-process.md) - PR guidelines
