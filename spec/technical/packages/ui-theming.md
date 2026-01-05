# UI Theming Guide

CSS custom properties and theming system for `@dxheroes/local-mcp-ui`.

## Overview

The UI package uses a CSS custom properties (variables) system with TailwindCSS v4. This enables:

- **Light/Dark mode** - Toggle with `.dark` class
- **Semantic colors** - Named variables like `--primary`, `--destructive`
- **Easy customization** - Override variables to change theme
- **Runtime theming** - Change colors without rebuilding

---

## Theme Structure

### File Location

```
packages/ui/src/styles/globals.css
```

### CSS Variables

All colors use HSL format for easy manipulation:

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  /* ... */
}
```

---

## Color System

### Semantic Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--background` | White | Near-black | Page background |
| `--foreground` | Near-black | White | Text color |
| `--primary` | Blue | Light blue | Primary actions |
| `--primary-foreground` | White | Dark | Text on primary |
| `--secondary` | Light gray | Dark gray | Secondary elements |
| `--secondary-foreground` | Dark | White | Text on secondary |
| `--muted` | Light gray | Dark gray | Muted backgrounds |
| `--muted-foreground` | Gray | Light gray | Muted text |
| `--accent` | Light gray | Dark gray | Accented elements |
| `--accent-foreground` | Dark | White | Text on accent |
| `--destructive` | Red | Dark red | Destructive actions |
| `--destructive-foreground` | White | White | Text on destructive |

### Surface Colors

| Variable | Usage |
|----------|-------|
| `--card` | Card backgrounds |
| `--card-foreground` | Card text |
| `--popover` | Popover/dropdown backgrounds |
| `--popover-foreground` | Popover text |

### Border & Input

| Variable | Usage |
|----------|-------|
| `--border` | Border color |
| `--input` | Input border color |
| `--ring` | Focus ring color |

### Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius` | `0.5rem` | Base border radius |
| `--radius-lg` | `var(--radius)` | Large radius |
| `--radius-md` | `calc(var(--radius) - 2px)` | Medium radius |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small radius |

---

## Light Mode Values

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);

  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);

  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222.2 84% 4.9%);

  --primary: hsl(221.2 83.2% 53.3%);
  --primary-foreground: hsl(210 40% 98%);

  --secondary: hsl(210 40% 96.1%);
  --secondary-foreground: hsl(222.2 47.4% 11.2%);

  --muted: hsl(210 40% 96.1%);
  --muted-foreground: hsl(215.4 16.3% 46.9%);

  --accent: hsl(210 40% 96.1%);
  --accent-foreground: hsl(222.2 47.4% 11.2%);

  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);

  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(221.2 83.2% 53.3%);

  --radius: 0.5rem;
}
```

---

## Dark Mode Values

```css
.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);

  --card: hsl(222.2 84% 4.9%);
  --card-foreground: hsl(210 40% 98%);

  --popover: hsl(222.2 84% 4.9%);
  --popover-foreground: hsl(210 40% 98%);

  --primary: hsl(217.2 91.2% 59.8%);
  --primary-foreground: hsl(222.2 47.4% 11.2%);

  --secondary: hsl(217.2 32.6% 17.5%);
  --secondary-foreground: hsl(210 40% 98%);

  --muted: hsl(217.2 32.6% 17.5%);
  --muted-foreground: hsl(215 20.2% 65.1%);

  --accent: hsl(217.2 32.6% 17.5%);
  --accent-foreground: hsl(210 40% 98%);

  --destructive: hsl(0 62.8% 30.6%);
  --destructive-foreground: hsl(210 40% 98%);

  --border: hsl(217.2 32.6% 17.5%);
  --input: hsl(217.2 32.6% 17.5%);
  --ring: hsl(224.3 76.3% 48%);
}
```

---

## TailwindCSS v4 Integration

### Theme Mapping

The `@theme inline` directive maps CSS variables to Tailwind colors:

```css
@theme inline {
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

### Using in Components

```tsx
// These Tailwind classes map to CSS variables:
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
</div>
```

---

## Dark Mode Implementation

### Toggle Dark Mode

Add/remove `.dark` class on root element:

```typescript
// Toggle dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

// Set dark mode
function setDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
```

### System Preference Detection

```typescript
// Check system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    setDarkMode(e.matches);
  });
```

### React Hook Example

```typescript
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return [isDark, setIsDark] as const;
}
```

---

## Customizing Theme

### Override Variables

Create a custom CSS file that overrides variables:

```css
/* custom-theme.css */
:root {
  /* Change primary color to green */
  --primary: hsl(142 76% 36%);
  --primary-foreground: hsl(0 0% 100%);

  /* Increase border radius */
  --radius: 0.75rem;
}

.dark {
  --primary: hsl(142 69% 58%);
}
```

### Import Order

```typescript
// Import UI styles first
import '@dxheroes/local-mcp-ui/styles';

// Then import custom overrides
import './custom-theme.css';
```

### Custom Brand Colors

```css
:root {
  /* Brand palette */
  --brand-50: hsl(210 100% 97%);
  --brand-100: hsl(210 100% 94%);
  --brand-500: hsl(210 100% 50%);
  --brand-600: hsl(210 100% 45%);
  --brand-900: hsl(210 100% 20%);

  /* Map to semantic variables */
  --primary: var(--brand-500);
  --primary-foreground: var(--brand-50);
}
```

---

## Base Layer Styles

The theme includes base styles for elements:

```css
@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

This ensures:
- All borders use the theme border color
- Body has correct background and text color

---

## Content Sources

The Tailwind configuration scans these paths for classes:

```css
@source "../../../../apps/frontend/src/**/*.{tsx,ts,jsx,js}";
@source "../components/**/*.{tsx,ts}";
```

If you add new component directories, update the `@source` directives.

---

## Color Utilities

### HSL to CSS Variable

```typescript
// Helper to create HSL value
function hsl(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

// Usage
document.documentElement.style.setProperty(
  '--primary',
  hsl(200, 80, 50)
);
```

### Runtime Theme Switching

```typescript
type Theme = 'light' | 'dark' | 'system';

function setTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
```

---

## See Also

- [UI Package Overview](./ui.md) - Package information
- [Component API Reference](./ui-components.md) - All components
- [Radix UI Patterns](./ui-radix-patterns.md) - Integration patterns
