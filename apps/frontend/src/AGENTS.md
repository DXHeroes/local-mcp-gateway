# Frontend Source

## Purpose

React 19 frontend source code: pages, components, and utilities.

**NOTE:** No user authentication required - all features are immediately accessible.

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
  - Configure builtin MCP servers (from mcp-servers/)
  - OAuth flow setup
  - API key setup
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

## Child Directories

- **[components/AGENTS.md](components/AGENTS.md)** - React components
- **[pages/AGENTS.md](pages/AGENTS.md)** - Page components (routes)
- **[lib/AGENTS.md](lib/AGENTS.md)** - Shared libraries and API client
- **[config/AGENTS.md](config/AGENTS.md)** - Configuration and API hooks
- **[utils/AGENTS.md](utils/AGENTS.md)** - Utility functions
- **[hooks/AGENTS.md](hooks/AGENTS.md)** - Custom React hooks
- **[__tests__/AGENTS.md](__tests__/AGENTS.md)** - Unit and integration tests

## Development Rules

- TDD: Write component tests before implementation
- All components must be accessible
- Mobile-first responsive design
- Type-safe props with TypeScript
- Use React Query for data fetching
- Zustand for local state management

