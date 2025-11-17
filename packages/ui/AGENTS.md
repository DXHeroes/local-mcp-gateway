# UI Package

## Purpose

This package provides shared UI components based on shadcn-ui for use across the frontend application.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Components

All components are based on shadcn-ui and follow the same patterns:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- TypeScript for type safety
- Variant props using `class-variance-authority`

## Usage

```typescript
import { Button, Card, Dialog } from '@local-mcp/ui';

function MyComponent() {
  return (
    <Card>
      <Button variant="default">Click me</Button>
    </Card>
  );
}
```

## Structure

```
ui/
├── src/
│   ├── components/          # shadcn-ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── lib/
│   │   └── utils.ts        # Utility functions (cn, etc.)
│   ├── styles/
│   │   └── globals.css     # Tailwind CSS v4 configuration with @theme inline
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Configuration

- **Vite**: Uses shared Vite config from `@local-mcp/config/vite` via `mergeConfig`
- **Tailwind CSS v4**: Configured in `src/styles/globals.css` with `@import "tailwindcss"`, `@source` directives, and `@theme inline`
- **TypeScript**: Extends root TypeScript config

## Development Rules

- All components must be accessible (Radix UI)
- Use Tailwind CSS for styling (configured in `src/styles/globals.css`)
- Export all components from `src/index.ts`
- Follow shadcn-ui patterns and conventions
- TypeScript strict mode
- JSDoc comments for all public APIs
- Vite config extends shared config from `@local-mcp/config`
- Tailwind CSS configuration is centralized in `src/styles/globals.css`

