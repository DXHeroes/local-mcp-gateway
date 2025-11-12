# Frontend Components

## Purpose

Reusable React components for the application UI.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Frontend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Frontend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Structure

```
components/
├── ui/                  # shadcn-ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── [other shadcn components]
├── ProfileCard.tsx
├── McpServerCard.tsx
├── OAuthFlowHandler.tsx
├── ApiKeyInput.tsx
└── DebugLogViewer.tsx
```

## Files

### UI Components (`ui/`)
- shadcn-ui components - Pre-built accessible components
  - `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`, `select.tsx`, etc.
  - All components from shadcn-ui library

### Custom Components
- `ProfileCard.tsx` - Profile card component
  - Displays profile name and description
  - Shows MCP endpoint URL
  - Copy-to-clipboard button
  - Edit/delete actions
- `McpServerCard.tsx` - MCP server card component
  - Displays MCP server name and type
  - Status indicator (online/offline)
  - OAuth status or API key indicator
  - Edit/delete actions
- `OAuthFlowHandler.tsx` - OAuth flow handler component
  - Initiates OAuth flow
  - Handles callback redirect
  - Shows success/error states
  - Loading states during flow
- `ApiKeyInput.tsx` - API key input component
  - Secure input (password type)
  - Header name selector (Authorization, X-API-Key, custom)
  - Header value template editor
  - Validation feedback
- `DebugLogViewer.tsx` - Debug log viewer component
  - JSON viewer with syntax highlighting
  - Expand/collapse for nested objects
  - Copy JSON functionality
  - Filter controls

## Development Rules

- All components must be accessible (ARIA labels, keyboard navigation)
- Mobile-first responsive design
- Type-safe props with TypeScript
- JSDoc comments for component props
- TDD: Write tests before implementation
- Use shadcn-ui components as base when possible

## Testing

- Unit tests with @testing-library/react
- Test accessibility with jest-axe
- Test user interactions
- Coverage: ≥90%

