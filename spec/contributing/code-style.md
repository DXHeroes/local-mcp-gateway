# Code Style Guide

Coding standards and conventions for Local MCP Gateway.

## Overview

This project uses Biome for formatting and linting, with TypeScript throughout.

---

## Tools

| Tool | Purpose |
|------|---------|
| Biome | Formatting + Linting |
| TypeScript | Type checking |
| EditorConfig | Editor settings |

---

## Running Checks

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm typecheck

# All checks
pnpm check
```

---

## TypeScript

### General Rules

- Use TypeScript for all code
- Prefer interfaces over types for objects
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is uncertain

### Examples

```typescript
// Good - explicit types
interface UserConfig {
  name: string;
  email: string;
  settings?: UserSettings;
}

function createUser(config: UserConfig): User {
  return new User(config);
}

// Avoid - implicit any
function createUser(config) { // Bad
  return new User(config);
}
```

### Type Imports

```typescript
// Use type-only imports when possible
import type { McpTool, McpResource } from './types';
import { McpServer } from './McpServer';
```

### Generics

```typescript
// Good - descriptive generic names
interface Repository<TEntity> {
  findById(id: string): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
}

// Avoid - single letter generics (except simple cases)
interface Repository<T> { // OK for simple cases
  find(id: string): Promise<T>;
}
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProfileCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `McpTypes.ts` |
| Tests | *.test.ts | `McpServer.test.ts` |
| Constants | UPPER_SNAKE | `API_ENDPOINTS.ts` |

### Variables

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Functions | camelCase | `getUserById` |
| Classes | PascalCase | `ProxyHandler` |
| Interfaces | PascalCase | `McpServerConfig` |
| Types | PascalCase | `ServerType` |
| Enums | PascalCase | `ConnectionStatus` |

### React Components

```typescript
// PascalCase for components
function ProfileCard({ profile }: ProfileCardProps) {
  return <div>{profile.name}</div>;
}

// camelCase for hooks
function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  return { profiles };
}
```

---

## Code Organization

### File Structure

```typescript
// 1. Imports (external, then internal)
import { useState, useEffect } from 'react';
import { Button } from '@local-mcp/ui';
import { Profile } from '../types';
import { formatDate } from '../utils';

// 2. Types/Interfaces
interface ProfileCardProps {
  profile: Profile;
  onEdit: (id: string) => void;
}

// 3. Constants
const MAX_DESCRIPTION_LENGTH = 100;

// 4. Component/Function
export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  // Implementation
}

// 5. Helper functions (if component-specific)
function truncateDescription(text: string): string {
  return text.slice(0, MAX_DESCRIPTION_LENGTH);
}
```

### Import Order

1. Node.js built-ins
2. External packages
3. Internal packages (`@local-mcp/*`)
4. Relative imports (parent, then sibling, then children)
5. Type imports

```typescript
// Node built-ins
import path from 'path';

// External
import express from 'express';
import { z } from 'zod';

// Internal packages
import { db } from '@local-mcp/database';
import { Button } from '@local-mcp/ui';

// Relative
import { ProfileService } from '../services';
import { formatProfile } from './utils';

// Types
import type { Profile, McpServer } from '../types';
```

---

## Functions

### Function Declarations

```typescript
// Prefer function declarations for top-level
function processRequest(request: Request): Response {
  // Implementation
}

// Arrow functions for callbacks and short functions
const items = list.map((item) => item.name);

// Arrow functions with explicit return for complex logic
const processItem = (item: Item): ProcessedItem => {
  const result = transform(item);
  return validate(result);
};
```

### Parameters

```typescript
// Use object parameters for 3+ arguments
// Good
function createServer(options: {
  name: string;
  type: ServerType;
  url: string;
  config?: ServerConfig;
}): McpServer {
  // Implementation
}

// Avoid many positional arguments
function createServer(
  name: string,
  type: ServerType,
  url: string,
  config?: ServerConfig // Hard to remember order
) {}
```

### Return Types

```typescript
// Explicit return types for public functions
export function getProfile(id: string): Promise<Profile | null> {
  return db.query.profiles.findFirst({ where: eq(profiles.id, id) });
}

// Implicit OK for simple private functions
const double = (n: number) => n * 2;
```

---

## Error Handling

### Async/Await

```typescript
// Use try/catch with specific error handling
async function fetchProfile(id: string): Promise<Profile> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, id)
    });

    if (!profile) {
      throw new NotFoundError(`Profile not found: ${id}`);
    }

    return profile;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch profile', { cause: error });
  }
}
```

### Custom Errors

```typescript
// Create specific error classes
class McpError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'McpError';
  }
}

class ConnectionError extends McpError {
  constructor(serverUrl: string) {
    super(`Failed to connect to ${serverUrl}`, 'CONNECTION_FAILED');
  }
}
```

---

## React Conventions

### Component Structure

```typescript
interface ProfileListProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
}

export function ProfileList({ profiles, onSelect }: ProfileListProps) {
  // 1. Hooks
  const [filter, setFilter] = useState('');
  const filteredProfiles = useMemo(
    () => profiles.filter(p => p.name.includes(filter)),
    [profiles, filter]
  );

  // 2. Event handlers
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  // 3. Render
  return (
    <div>
      <input value={filter} onChange={handleFilterChange} />
      {filteredProfiles.map(profile => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onClick={() => onSelect(profile)}
        />
      ))}
    </div>
  );
}
```

### Hooks

```typescript
// Custom hooks prefixed with 'use'
function useProfile(id: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProfile(id)
      .then(setProfile)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { profile, loading, error };
}
```

---

## Comments

### When to Comment

```typescript
// Good - explains WHY, not WHAT
// OAuth tokens expire after 1 hour, so we refresh 5 minutes early
// to avoid race conditions during long-running operations
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Avoid - states the obvious
// Set the name to the user's name
const name = user.name;
```

### Documentation Comments

```typescript
/**
 * Creates an MCP server instance based on configuration.
 *
 * @param config - Server configuration including type and connection details
 * @returns Configured MCP server instance
 * @throws {InvalidConfigError} If configuration is invalid
 *
 * @example
 * const server = McpServerFactory.create({
 *   id: 'github',
 *   name: 'GitHub',
 *   type: 'remote_http',
 *   config: { url: 'https://mcp.github.com' }
 * });
 */
export function create(config: McpServerConfig): McpServer {
  // Implementation
}
```

---

## Testing Style

```typescript
describe('ProfileService', () => {
  // Group related tests
  describe('createProfile', () => {
    it('creates a profile with valid data', async () => {
      // Arrange
      const input = { name: 'Test', slug: 'test' };

      // Act
      const result = await profileService.create(input);

      // Assert
      expect(result).toMatchObject(input);
      expect(result.id).toBeDefined();
    });

    it('throws on duplicate slug', async () => {
      // Test error case
      await profileService.create({ name: 'First', slug: 'duplicate' });

      await expect(
        profileService.create({ name: 'Second', slug: 'duplicate' })
      ).rejects.toThrow('Slug already exists');
    });
  });
});
```

---

## See Also

- [Development Setup](./development-setup.md) - Environment setup
- [Testing Guide](./testing-guide.md) - Testing practices
- [Pull Request Process](./pull-request-process.md) - PR guidelines
