# Radix UI Integration Patterns

How Radix UI primitives are wrapped and used in `@dxheroes/local-mcp-ui`.

## Overview

The UI package wraps [Radix UI](https://www.radix-ui.com/) primitives with Tailwind styling. This provides:

- **Accessibility** - ARIA attributes, keyboard navigation, focus management
- **Unstyled primitives** - Full control over styling
- **Composable** - Build complex UIs from simple parts
- **Type-safe** - Full TypeScript support

---

## Radix Primitives Used

| Primitive | Package | UI Components |
|-----------|---------|---------------|
| Alert Dialog | `@radix-ui/react-alert-dialog` | AlertDialog |
| Checkbox | `@radix-ui/react-checkbox` | Checkbox |
| Dialog | `@radix-ui/react-dialog` | Dialog |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` | (future) |
| Label | `@radix-ui/react-label` | Label |
| Radio Group | `@radix-ui/react-radio-group` | RadioGroup |
| Select | `@radix-ui/react-select` | Select |
| Slot | `@radix-ui/react-slot` | Button (asChild) |
| Toast | `@radix-ui/react-toast` | Toast |
| Tooltip | `@radix-ui/react-tooltip` | Tooltip |

---

## Wrapper Patterns

### Pattern 1: Direct Export

Re-export primitive unchanged for root/trigger components:

```typescript
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Direct re-export - no styling needed
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

export { Dialog, DialogTrigger, DialogPortal, DialogClose };
```

**When to use:** Root containers, triggers, close buttons - components that don't need styling.

---

### Pattern 2: Styled Wrapper

Wrap primitive with `forwardRef` and add Tailwind classes:

```typescript
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Base styles
      'fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm',
      // Animations via data attributes
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      // Allow override
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
```

**Key elements:**

1. `React.forwardRef` - Pass ref to primitive
2. `React.ElementRef<typeof Primitive>` - Correct ref type
3. `React.ComponentPropsWithoutRef<typeof Primitive>` - Props type
4. `cn(baseClasses, className)` - Merge with user classes
5. `displayName` - Preserve component name for DevTools

---

### Pattern 3: Composite Wrapper

Combine multiple primitives into a single component:

```typescript
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // Wrap in Portal
  <DialogPortal>
    {/* Include Overlay */}
    <DialogOverlay />
    {/* Styled Content */}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-[100] translate-x-[-50%] translate-y-[-50%]',
        'grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        className
      )}
      {...props}
    >
      {children}
      {/* Built-in close button */}
      <DialogPrimitive.Close className="absolute right-4 top-4 ...">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
```

**When to use:** When a component should always include related components (portal, overlay, close button).

---

### Pattern 4: Layout Wrapper

Pure styled div for layout sections:

```typescript
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';
```

**When to use:** Section containers that don't need Radix functionality.

---

## The `asChild` Pattern

Radix uses `Slot` for the `asChild` prop, allowing component merging:

```typescript
import { Slot } from '@radix-ui/react-slot';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Use Slot when asChild is true
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Usage:**

```tsx
// Normal button
<Button>Click me</Button>

// Renders as anchor, but with Button styles
<Button asChild>
  <a href="/page">Link Button</a>
</Button>

// Renders as Link component
<Button asChild>
  <Link to="/page">Route Button</Link>
</Button>
```

**How Slot works:**
- Merges props from Button onto the child element
- Child element is rendered instead of Button's default element
- Styles, event handlers, refs all transferred to child

---

## Data Attributes for State

Radix components expose state via `data-*` attributes:

```typescript
// Animations based on state
className={cn(
  // Open state animations
  'data-[state=open]:animate-in',
  'data-[state=open]:fade-in-0',
  'data-[state=open]:zoom-in-95',

  // Close state animations
  'data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0',
  'data-[state=closed]:zoom-out-95',

  // Disabled state
  'data-[disabled]:pointer-events-none',
  'data-[disabled]:opacity-50',

  // Placeholder state (Select)
  'data-[placeholder]:text-muted-foreground',
)}
```

**Common data attributes:**

| Attribute | Values | Components |
|-----------|--------|------------|
| `data-state` | `open`, `closed` | Dialog, AlertDialog, Select, Toast |
| `data-state` | `checked`, `unchecked`, `indeterminate` | Checkbox |
| `data-disabled` | (boolean) | All interactive |
| `data-placeholder` | (boolean) | Select |
| `data-side` | `top`, `bottom`, `left`, `right` | Select, Tooltip |
| `data-swipe` | `start`, `move`, `cancel`, `end` | Toast |

---

## Animation Patterns

### Using Tailwind Animate

```typescript
// Entry animations
'data-[state=open]:animate-in'
'data-[state=open]:fade-in-0'
'data-[state=open]:slide-in-from-top-2'

// Exit animations
'data-[state=closed]:animate-out'
'data-[state=closed]:fade-out-0'
'data-[state=closed]:slide-out-to-top-2'
```

### Toast Swipe Animation

```typescript
className={cn(
  // Swipe tracking via CSS custom property
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
  'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
  'data-[swipe=move]:transition-none', // Disable transition during swipe
  'data-[swipe=end]:animate-out',      // Animate on swipe complete
)}
```

---

## Accessibility Features (Built-in)

Radix provides these automatically:

### Keyboard Navigation

| Component | Keys |
|-----------|------|
| Dialog | `Escape` to close |
| Select | `Arrow Up/Down` to navigate, `Enter` to select |
| RadioGroup | `Arrow Up/Down/Left/Right` to navigate |
| Checkbox | `Space` to toggle |
| Toast | `Escape` to dismiss |

### Focus Management

- Dialog traps focus inside when open
- Select moves focus to content when open
- Focus returns to trigger when closed

### ARIA Attributes

```html
<!-- Dialog example (auto-generated) -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
</div>

<!-- Checkbox example -->
<button role="checkbox" aria-checked="true">
```

---

## Adding New Radix Components

### Step 1: Install Primitive

```bash
pnpm add @radix-ui/react-accordion
```

### Step 2: Create Component File

```typescript
// packages/ui/src/components/accordion.tsx
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as React from 'react';
import { cn } from '../lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

// ... more components

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

### Step 3: Export from Index

```typescript
// packages/ui/src/index.ts
export * from './components/accordion';
```

### Step 4: Document

Add to `ui-components.md` with props, examples, and sub-components.

---

## Type Safety

### Extracting Prop Types

```typescript
// Get element ref type
type DialogContentRef = React.ElementRef<typeof DialogPrimitive.Content>;

// Get props type (without ref)
type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

// Extend with custom props
interface ExtendedDialogContentProps extends DialogContentProps {
  showCloseButton?: boolean;
}
```

### Variant Props with CVA

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { default: '...', sm: '...' },
  },
});

// Combine with HTML attributes
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

---

## Common Patterns Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| Direct Export | Root, Trigger, Close | `Dialog`, `DialogTrigger` |
| Styled Wrapper | Visible components | `DialogOverlay`, `DialogContent` |
| Composite | Multi-part components | `DialogContent` (includes Portal, Overlay) |
| Layout | Section containers | `DialogHeader`, `DialogFooter` |
| asChild | Element polymorphism | `Button asChild` |

---

## See Also

- [UI Package Overview](./ui.md) - Package information
- [Component API Reference](./ui-components.md) - All components
- [Theming Guide](./ui-theming.md) - CSS variables
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction) - Official docs
