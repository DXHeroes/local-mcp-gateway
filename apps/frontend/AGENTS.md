# Frontend Application

## Purpose

React 19 frontend application for managing profiles, MCP servers, OAuth flows, API keys, and viewing debug logs. Built with Vite, TailwindCSS, and shadcn-ui.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Apps directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Profiles.tsx        # Profile management page
│   │   ├── McpServers.tsx      # MCP server management page
│   │   ├── CustomMcp.tsx        # Custom MCP creation page
│   │   └── DebugLogs.tsx       # Debug logs viewer page
│   ├── components/
│   │   ├── ui/                  # shadcn-ui components
│   │   ├── ProfileCard.tsx
│   │   ├── McpServerCard.tsx
│   │   ├── OAuthFlowHandler.tsx
│   │   ├── ApiKeyInput.tsx
│   │   └── DebugLogViewer.tsx
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── utils.ts             # Utility functions
│   └── main.tsx                 # App entry point
├── __tests__/
│   ├── unit/                    # Component unit tests
│   └── integration/             # Integration tests (MSW)
├── e2e/
│   ├── profiles.spec.ts
│   ├── mcp-servers.spec.ts
│   ├── oauth-flow.spec.ts
│   └── custom-mcp.spec.ts
├── Dockerfile                   # Multi-stage Docker build
├── nginx.conf                   # Nginx config for production
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Key Pages

- `src/pages/Profiles.tsx` - List, create, edit profiles with MCP endpoint URL display
- `src/pages/McpServers.tsx` - Add/manage MCP servers (OAuth/API key setup)
- `src/pages/CustomMcp.tsx` - Create and manage custom MCP servers
- `src/pages/DebugLogs.tsx` - View debug logs with filtering

## Key Components

- `src/components/OAuthFlowHandler.tsx` - Handles OAuth consent screen redirect
- `src/components/ApiKeyInput.tsx` - Secure API key input with header configuration
- `src/components/DebugLogViewer.tsx` - JSON viewer for debug logs

## Dependencies

- `react` (v19) - UI framework
- `vite` - Build tool and dev server
- `tailwindcss` - Styling
- `shadcn-ui` - UI components
- `@tanstack/react-query` (v5) - Data fetching
- `react-router` (v7) - Routing
- `zustand` - State management

## Development Rules

- **TDD**: Write component tests before implementation
- **Hot-reload**: Vite HMR enabled
- **Type safety**: Full TypeScript strict mode
- **Accessibility**: All components must be accessible
- **Responsive**: Mobile-first design
- **Documentation**: Component props documented

## Testing Requirements

- Unit tests for all components (@testing-library/react)
- Integration tests with MSW for API mocking
- E2E tests for all user flows (Playwright)
- Coverage: ≥90%

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)

## Related Documentation

- [../../docs/guides/creating-profiles.md](../../docs/guides/creating-profiles.md) - User guide
- [../../docs/guides/oauth-setup.md](../../docs/guides/oauth-setup.md) - OAuth setup

