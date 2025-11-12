# Frontend Source

## Purpose

React 19 frontend source code: pages, components, and utilities.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Frontend application instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Apps directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Structure

```
src/
├── pages/
│   ├── Profiles.tsx        # Profile management page
│   ├── McpServers.tsx      # MCP server management page
│   ├── CustomMcp.tsx        # Custom MCP creation page
│   └── DebugLogs.tsx       # Debug logs viewer page
├── components/
│   ├── ui/                  # shadcn-ui components
│   ├── ProfileCard.tsx
│   ├── McpServerCard.tsx
│   ├── OAuthFlowHandler.tsx
│   ├── ApiKeyInput.tsx
│   └── DebugLogViewer.tsx
├── lib/
│   ├── api.ts               # API client
│   └── utils.ts             # Utility functions
└── main.tsx                 # App entry point
```

## Files

### Pages (`pages/`)
- `Profiles.tsx` - Profile management page
  - List profiles
  - Create/edit profiles
  - Display MCP endpoint URL for each profile
  - Copy-to-clipboard functionality
- `McpServers.tsx` - MCP server management page
  - Add external MCP servers (HTTP/SSE)
  - OAuth flow setup
  - API key setup
  - Linear MCP quick setup
- `CustomMcp.tsx` - Custom MCP creation page
  - Code editor with syntax highlighting
  - Hot-reload preview
  - Validation feedback
- `DebugLogs.tsx` - Debug logs viewer page
  - Filter by profile, MCP server, request type
  - JSON viewer for request/response payloads
  - Real-time updates

### Components (`components/`)
- `ui/` - shadcn-ui components (Button, Input, Card, etc.)
- `ProfileCard.tsx` - Profile card component with MCP endpoint display
- `McpServerCard.tsx` - MCP server card with status indicator
- `OAuthFlowHandler.tsx` - Handles OAuth consent screen redirect and callback
- `ApiKeyInput.tsx` - Secure API key input with header configuration
- `DebugLogViewer.tsx` - JSON viewer component for debug logs

### Libraries (`lib/`)
- `api.ts` - API client using fetch or axios
  - Type-safe API calls
  - Error handling
  - Request/response interceptors
- `utils.ts` - Utility functions
  - Formatting helpers
  - Validation helpers
  - Common utilities

### Entry Point
- `main.tsx` - React app entry point, router setup, providers

## Development Rules

- TDD: Write component tests before implementation
- All components must be accessible
- Mobile-first responsive design
- Type-safe props with TypeScript
- Use React Query for data fetching
- Zustand for local state management

