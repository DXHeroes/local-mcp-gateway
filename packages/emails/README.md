# @dxheroes/local-mcp-emails

Professional email templates for Local MCP Gateway using React Email and Resend.

## Features

- Type-safe React components for email templates
- Live preview development server with hot reload
- Dark mode support
- Email client compatibility (Gmail, Outlook, Apple Mail)
- Tailwind CSS with automatic inline style conversion
- Reusable components for consistent branding

## Email Templates

### VerificationEmail

Sent when users sign up to verify their email address.

```typescript
import { VerificationEmail, renderEmail } from '@dxheroes/local-mcp-emails';

const html = await renderEmail(
  VerificationEmail({
    verificationUrl: 'https://app.example.com/verify?token=abc123',
    userName: 'John Doe', // Optional
  })
);
```

### PasswordResetEmail

Sent when users request a password reset.

```typescript
import { PasswordResetEmail, renderEmail } from '@dxheroes/local-mcp-emails';

const html = await renderEmail(
  PasswordResetEmail({
    resetUrl: 'https://app.example.com/reset-password?token=xyz789',
    userName: 'Jane Smith', // Optional
  })
);
```

### TwoFactorEnabledEmail

Notification sent when two-factor authentication is enabled.

```typescript
import { TwoFactorEnabledEmail, renderEmail } from '@dxheroes/local-mcp-emails';

const html = await renderEmail(
  TwoFactorEnabledEmail({
    userName: 'Alex Johnson', // Optional
  })
);
```

## Development

### Live Preview Server

Start the React Email development server to preview all templates:

```bash
pnpm --filter @dxheroes/local-mcp-emails dev
```

Opens at `http://localhost:3000` with:
- Live preview of all email templates
- Hot reload on file changes
- Dark mode toggle
- Email client previews (Gmail, Outlook, Apple Mail)

### Build

Compile TypeScript to JavaScript:

```bash
pnpm --filter @dxheroes/local-mcp-emails build
```

### Export Static HTML

Export all email templates as static HTML files:

```bash
pnpm --filter @dxheroes/local-mcp-emails export
```

## Reusable Components

### EmailLayout

Base wrapper for all email templates:

```tsx
import { EmailLayout } from '@dxheroes/local-mcp-emails';

<EmailLayout preview="Preview text shown in inbox">
  {/* Your email content */}
</EmailLayout>
```

### EmailButton

Call-to-action button with variants:

```tsx
import { EmailButton } from '@dxheroes/local-mcp-emails';

<EmailButton url="https://example.com" variant="primary">
  Click Me
</EmailButton>

<EmailButton url="https://example.com" variant="danger">
  Reset Password
</EmailButton>
```

Variants:
- `primary` - Indigo button (default)
- `danger` - Red button for destructive actions

### EmailFooter

Reusable footer with legal text:

```tsx
import { EmailFooter } from '@dxheroes/local-mcp-emails';

<EmailFooter
  text="Local MCP Gateway"
  subtext="This email was sent from your Local MCP Gateway installation."
/>
```

### EmailWarning

Warning or info boxes:

```tsx
import { EmailWarning } from '@dxheroes/local-mcp-emails';

<EmailWarning type="warning" title="Important">
  This link will expire in 1 hour.
</EmailWarning>

<EmailWarning type="info" title="Security Notice">
  Your account is now more secure.
</EmailWarning>
```

Types:
- `warning` - Red border, red background
- `info` - Blue border, blue background

## Creating New Templates

1. Create a new file in `src/templates/`:

```tsx
// src/templates/my-email.tsx
import { Heading, Text } from '@react-email/components';
import { EmailLayout, EmailButton, EmailFooter } from '../components/index.js';

export interface MyEmailProps {
  userName: string;
  actionUrl: string;
}

export function MyEmail({ userName, actionUrl }: MyEmailProps) {
  return (
    <EmailLayout preview="My email preview">
      <Heading className="mb-6 text-2xl font-bold text-gray-900">
        Hello {userName}
      </Heading>
      <Text className="mb-6 text-base text-gray-700">
        This is my custom email template.
      </Text>
      <EmailButton url={actionUrl}>Take Action</EmailButton>
      <EmailFooter />
    </EmailLayout>
  );
}

// Required for React Email preview
MyEmail.PreviewProps = {
  userName: 'John Doe',
  actionUrl: 'https://example.com/action',
} as MyEmailProps;

export default MyEmail;
```

2. Export from `src/index.ts`:

```typescript
export { MyEmail } from './templates/my-email.js';
export type { MyEmailProps } from './templates/my-email.js';
```

3. Use in your backend:

```typescript
import { MyEmail, renderEmail } from '@dxheroes/local-mcp-emails';

const html = await renderEmail(
  MyEmail({
    userName: 'John',
    actionUrl: 'https://example.com',
  })
);
```

## Styling Best Practices

### Use Tailwind Classes

React Email automatically converts Tailwind classes to inline styles:

```tsx
<Text className="text-base text-gray-700">
  This will be converted to inline styles
</Text>
```

### Dark Mode Support

Add dark mode variants:

```tsx
<Text className="text-gray-900 dark:text-gray-100">
  Adapts to dark mode
</Text>
```

### Email-Safe Components

Use React Email components instead of HTML elements:

- `<Text>` instead of `<p>`
- `<Heading>` instead of `<h1>`-`<h6>`
- `<Link>` instead of `<a>`
- `<Button>` for CTAs
- `<Section>` instead of `<div>` for layout

## Environment Variables

When using with Resend in your backend:

```env
# Required
RESEND_API_KEY=re_your_api_key_here

# Optional
EMAIL_FROM="Local MCP Gateway <noreply@local-mcp.dev>"
NODE_ENV=development  # Logs emails to console instead of sending
```

Get a Resend API key at [resend.com](https://resend.com) (free tier: 100 emails/day).

## License

MIT
