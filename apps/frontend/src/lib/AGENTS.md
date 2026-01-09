# Frontend Libraries

## Purpose

Utility libraries for API client and common functions.

**NOTE:** No authentication utilities needed - all API calls are public.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Frontend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Frontend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `api.ts` - API client
  - Type-safe API calls using TypeScript
  - Error handling and retry logic
  - Request/response interceptors
  - Uses React Query under the hood
  - Functions for all API endpoints:
    - profiles API
    - mcp-servers API
    - oauth API
    - debug-logs API
- `utils.ts` - Utility functions
  - Formatting helpers (dates, JSON, etc.)
  - Validation helpers
  - URL helpers
  - Common utilities (copy to clipboard, etc.)

## Development Rules

- Type-safe API calls
- Error handling for all API calls
- Retry logic for failed requests
- Request/response type definitions
- JSDoc comments for all functions

## Usage Example

```typescript
import { api } from '@/lib/api';

const profiles = await api.profiles.list();
const profile = await api.profiles.create({ name: 'my-profile' });
```

