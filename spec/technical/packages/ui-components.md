# UI Component API Reference

Complete API documentation for all components in `@dxheroes/local-mcp-ui`.

---

## Form Controls

### Button

Versatile button component with multiple variants and sizes.

**Import:**
```typescript
import { Button, buttonVariants } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `asChild` | `boolean` | `false` | Merge props onto child element |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `ButtonHTMLAttributes` | - | Native button props |

**Variants:**

| Variant | Description |
|---------|-------------|
| `default` | Primary blue background |
| `destructive` | Red background for dangerous actions |
| `outline` | Border only, transparent background |
| `secondary` | Gray background |
| `ghost` | No background, shows on hover |
| `link` | Text with underline on hover |

**Sizes:**

| Size | Dimensions |
|------|------------|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 px-3` |
| `lg` | `h-11 px-8` |
| `icon` | `h-10 w-10` |

**Example:**
```tsx
<Button variant="default" size="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon"><Icon /></Button>

{/* asChild pattern - renders as anchor */}
<Button asChild>
  <a href="/page">Link Button</a>
</Button>
```

---

### Input

Text input field with consistent styling.

**Import:**
```typescript
import { Input } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `InputHTMLAttributes` | - | Native input props |

**Example:**
```tsx
<Input type="text" placeholder="Enter name" />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" disabled />
```

---

### Textarea

Multi-line text input.

**Import:**
```typescript
import { Textarea } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `...props` | `TextareaHTMLAttributes` | - | Native textarea props |

**Example:**
```tsx
<Textarea placeholder="Enter description" rows={4} />
```

---

### Checkbox

Checkbox input with Radix UI primitives.

**Import:**
```typescript
import { Checkbox } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean \| 'indeterminate'` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Initial checked state |
| `onCheckedChange` | `(checked: boolean) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disable checkbox |
| `className` | `string` | - | Additional CSS classes |

**Example:**
```tsx
<Checkbox id="terms" />
<label htmlFor="terms">Accept terms</label>

{/* Controlled */}
<Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
```

---

### RadioGroup

Radio button group with Radix UI primitives.

**Import:**
```typescript
import { RadioGroup, RadioGroupItem } from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `RadioGroup` | Container for radio items |
| `RadioGroupItem` | Individual radio button |

**RadioGroup Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Initial value |
| `onValueChange` | `(value: string) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disable all items |

**Example:**
```tsx
<RadioGroup defaultValue="option-1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-1" id="option-1" />
    <Label htmlFor="option-1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-2" id="option-2" />
    <Label htmlFor="option-2">Option 2</Label>
  </div>
</RadioGroup>
```

---

### Select

Dropdown select with Radix UI primitives.

**Import:**
```typescript
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `Select` | Root container |
| `SelectTrigger` | Button that opens dropdown |
| `SelectValue` | Displays selected value |
| `SelectContent` | Dropdown container |
| `SelectItem` | Selectable option |
| `SelectGroup` | Groups related items |
| `SelectLabel` | Group label |
| `SelectSeparator` | Visual separator |

**Select Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Initial value |
| `onValueChange` | `(value: string) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disable select |

**Example:**
```tsx
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Vegetables</SelectLabel>
      <SelectItem value="carrot">Carrot</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

---

### Label

Form label component.

**Import:**
```typescript
import { Label } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `htmlFor` | `string` | - | Associated input ID |
| `className` | `string` | - | Additional CSS classes |

**Example:**
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

---

## Dialogs

### Dialog

Modal dialog with Radix UI primitives.

**Import:**
```typescript
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `Dialog` | Root container (controls open state) |
| `DialogTrigger` | Element that opens dialog |
| `DialogContent` | Modal content container |
| `DialogHeader` | Header section |
| `DialogTitle` | Dialog title |
| `DialogDescription` | Dialog description |
| `DialogFooter` | Footer section (for actions) |
| `DialogClose` | Close button |
| `DialogPortal` | Portal for rendering outside DOM tree |
| `DialogOverlay` | Background overlay |

**Dialog Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |

**Example:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <Input placeholder="Name" />
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### AlertDialog

Confirmation dialog with required action.

**Import:**
```typescript
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `AlertDialog` | Root container |
| `AlertDialogTrigger` | Element that opens dialog |
| `AlertDialogContent` | Modal content |
| `AlertDialogHeader` | Header section |
| `AlertDialogTitle` | Dialog title |
| `AlertDialogDescription` | Dialog description |
| `AlertDialogFooter` | Footer section |
| `AlertDialogAction` | Confirm action button |
| `AlertDialogCancel` | Cancel button |

**Example:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Feedback

### Alert

Static alert/notification box.

**Import:**
```typescript
import { Alert, AlertTitle, AlertDescription } from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `Alert` | Container |
| `AlertTitle` | Alert title |
| `AlertDescription` | Alert message |

**Alert Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive'` | `'default'` | Visual style |

**Example:**
```tsx
<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

---

### Badge

Small status indicator.

**Import:**
```typescript
import { Badge, badgeVariants } from '@dxheroes/local-mcp-ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'success' \| 'warning'` | `'default'` | Visual style |

**Variants:**

| Variant | Description |
|---------|-------------|
| `default` | Primary blue |
| `secondary` | Gray |
| `destructive` | Red |
| `outline` | Border only |
| `success` | Green |
| `warning` | Orange |

**Example:**
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### Toast

Temporary notification system.

**Import:**
```typescript
import { useToast, toast, Toaster } from '@dxheroes/local-mcp-ui';
```

**Setup:**
```tsx
// In your app root
import { Toaster } from '@dxheroes/local-mcp-ui';

function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  );
}
```

**useToast Hook:**

```typescript
const { toast, dismiss, toasts } = useToast();

// Returns
interface UseToastReturn {
  toast: (props: ToastProps) => { id: string; dismiss: () => void; update: (props) => void };
  dismiss: (toastId?: string) => void;
  toasts: ToasterToast[];
}
```

**Toast Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `ReactNode` | - | Toast title |
| `description` | `ReactNode` | - | Toast message |
| `variant` | `'default' \| 'destructive' \| 'success'` | `'default'` | Visual style |
| `action` | `ToastActionElement` | - | Action button |
| `duration` | `number` | `5000` | Auto-dismiss time (ms) |

**Example:**
```tsx
function MyComponent() {
  const { toast } = useToast();

  return (
    <Button onClick={() => {
      toast({
        title: "Success!",
        description: "Your changes have been saved.",
        variant: "success",
      });
    }}>
      Save
    </Button>
  );
}

// With action
toast({
  title: "Undo?",
  description: "Item deleted.",
  action: <ToastAction altText="Undo">Undo</ToastAction>,
});
```

---

### Tooltip

Hover tooltip with Radix UI primitives.

**Import:**
```typescript
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@dxheroes/local-mcp-ui';
```

**Setup:**
```tsx
// Wrap your app or section with TooltipProvider
<TooltipProvider>
  <YourComponents />
</TooltipProvider>
```

**Example:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Tooltip content</p>
  </TooltipContent>
</Tooltip>
```

---

## Layout

### Card

Container component for grouped content.

**Import:**
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@dxheroes/local-mcp-ui';
```

**Components:**

| Component | Description |
|-----------|-------------|
| `Card` | Outer container with border and shadow |
| `CardHeader` | Header section with padding |
| `CardTitle` | Card title (h3) |
| `CardDescription` | Subtitle/description |
| `CardContent` | Main content area |
| `CardFooter` | Footer section |

**Example:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content...</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## Utilities

### cn()

Class name utility for merging Tailwind classes.

**Import:**
```typescript
import { cn } from '@dxheroes/local-mcp-ui';
```

**Usage:**
```typescript
// Merge classes
cn('px-4 py-2', 'bg-blue-500')
// => 'px-4 py-2 bg-blue-500'

// Conditional classes
cn('base-class', isActive && 'active-class')
// => 'base-class active-class' or 'base-class'

// Override conflicting classes
cn('px-4', 'px-8')
// => 'px-8' (tailwind-merge resolves conflicts)

// With arrays and objects
cn(['px-4', 'py-2'], { 'bg-red-500': isError })
```

---

## See Also

- [UI Package Overview](./ui.md) - Package information
- [Theming Guide](./ui-theming.md) - CSS variables and customization
- [Radix UI Patterns](./ui-radix-patterns.md) - Integration patterns
