# UI Package

Technical documentation for the `@dxheroes/local-mcp-ui` package.

## Overview

The UI package provides shared React components based on the **shadcn-ui** pattern - a collection of reusable components built on top of Radix UI primitives and styled with Tailwind CSS.

---

## Package Information

| Property | Value |
|----------|-------|
| **Name** | `@dxheroes/local-mcp-ui` |
| **Version** | 0.1.1 |
| **Type** | ES Module |
| **Main** | `./dist/index.js` |
| **Styles** | `./dist/index.css` |

---

## Installation

```bash
pnpm add @dxheroes/local-mcp-ui
```

**Peer Dependencies:**

```bash
pnpm add react@^19.0.0 react-dom@^19.0.0
```

---

## Usage

### Import Components

```typescript
import { Button, Card, Dialog, Input } from '@dxheroes/local-mcp-ui';
```

### Import Styles

```typescript
// In your app entry point
import '@dxheroes/local-mcp-ui/styles';
```

### Example

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@dxheroes/local-mcp-ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Dependencies

### Radix UI Primitives

| Package | Version | Used By |
|---------|---------|---------|
| `@radix-ui/react-alert-dialog` | ^1.1.15 | AlertDialog |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkbox |
| `@radix-ui/react-dialog` | ^1.1.15 | Dialog |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | (future) |
| `@radix-ui/react-label` | ^2.1.8 | Label |
| `@radix-ui/react-radio-group` | ^1.3.8 | RadioGroup |
| `@radix-ui/react-select` | ^2.2.6 | Select |
| `@radix-ui/react-slot` | ^1.2.4 | Button (asChild) |
| `@radix-ui/react-toast` | ^1.2.15 | Toast |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltip |

### Styling & Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.1.17 | CSS framework |
| `class-variance-authority` | ^0.7.1 | Variant management |
| `clsx` | ^2.1.1 | Class conditionals |
| `tailwind-merge` | ^3.4.0 | Class deduplication |
| `lucide-react` | ^0.553.0 | Icons |

---

## Exports

### Components

```typescript
// Form Controls
export { Button, buttonVariants } from './components/button';
export { Checkbox } from './components/checkbox';
export { Input } from './components/input';
export { Label } from './components/label';
export { RadioGroup, RadioGroupItem } from './components/radio-group';
export { Select, SelectTrigger, SelectContent, SelectItem, ... } from './components/select';
export { Textarea } from './components/textarea';

// Dialogs
export { Dialog, DialogTrigger, DialogContent, ... } from './components/dialog';
export { AlertDialog, AlertDialogTrigger, ... } from './components/alert-dialog';

// Feedback
export { Alert, AlertTitle, AlertDescription } from './components/alert';
export { Badge, badgeVariants } from './components/badge';
export { Toast, ToastTitle, ... } from './components/toast';
export { Toaster } from './components/toaster';
export { useToast, toast } from './components/use-toast';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';

// Layout
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/card';
```

### Utilities

```typescript
export { cn } from './lib/utils';
```

---

## Component Categories

| Category | Components | Count |
|----------|------------|-------|
| **Form Controls** | Button, Checkbox, Input, Label, RadioGroup, Select, Textarea | 7 |
| **Dialogs** | Dialog, AlertDialog | 2 |
| **Feedback** | Alert, Badge, Toast, Tooltip | 4 |
| **Layout** | Card | 1 |
| **Hooks** | useToast | 1 |

---

## shadcn-ui Pattern

This package follows the [shadcn-ui](https://ui.shadcn.com/) architecture:

1. **Radix Primitives** - Accessible, unstyled components
2. **Tailwind Styling** - Utility-first CSS via class names
3. **CVA Variants** - Type-safe variant management
4. **Copy-Paste Philosophy** - Components are owned, not imported

### Key Characteristics

- **No runtime CSS-in-JS** - Pure Tailwind classes
- **Full customization** - Modify any component directly
- **Composable** - Build complex UIs from simple parts
- **Accessible by default** - Radix handles ARIA, keyboard, focus

---

## File Structure

```
packages/ui/
├── src/
│   ├── index.ts              # Package exports
│   ├── components/
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── radio-group.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── tooltip.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils.ts          # cn() helper
│   └── styles/
│       └── globals.css       # Theme variables
├── package.json
└── vite.config.ts
```

---

## Build

```bash
# Build package
pnpm --filter @dxheroes/local-mcp-ui build

# Watch mode
pnpm --filter @dxheroes/local-mcp-ui dev

# Type check
pnpm --filter @dxheroes/local-mcp-ui typecheck
```

---

## See Also

- [Component API Reference](./ui-components.md) - All component props and variants
- [Theming Guide](./ui-theming.md) - CSS variables and dark mode
- [Radix UI Patterns](./ui-radix-patterns.md) - Integration patterns
- [Packages Overview](./README.md) - All packages
