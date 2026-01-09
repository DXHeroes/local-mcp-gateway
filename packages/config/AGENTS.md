# Config Package

## Purpose

Shared configuration for TypeScript, Vitest, and Vite used across all packages and apps in the monorepo.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
config/
├── src/
│   ├── vitest.ts        # Shared Vitest configuration
│   ├── typescript.ts    # Shared TypeScript configuration
│   ├── vite.ts          # Shared Vite configuration
│   └── index.ts         # Package exports
├── package.json
└── tsconfig.json
```

## Usage

### Vitest Config

```typescript
import { defineConfig } from 'vitest/config';
import { sharedVitestConfig } from '@dxheroes/local-mcp-config/vitest';

export default defineConfig({
  ...sharedVitestConfig,
  // Package-specific overrides
});
```

### TypeScript Config

```json
{
  "extends": "@dxheroes/local-mcp-config/typescript",
  "compilerOptions": {
    // Package-specific overrides
  }
}
```

### Vite Config

```typescript
import { defineConfig, mergeConfig } from 'vite';
import { sharedViteConfig } from '@dxheroes/local-mcp-config/vite';

export default defineConfig(
  mergeConfig(sharedViteConfig, {
    // Package-specific Vite configuration
  }),
);
```

## Development Rules

- Keep configurations minimal and shared
- Only include settings used by all packages
- Package-specific configs should extend these base configs
- Vite configs should use `mergeConfig` to extend shared config

