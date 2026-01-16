/**
 * API Configuration
 * Determines the base URL for API requests based on the environment
 */

interface ImportMetaEnv {
  DEV?: boolean;
  VITE_API_URL?: string;
}

interface ImportMetaWithEnv {
  env?: ImportMetaEnv;
}

// In development, Vite proxy handles /api -> http://localhost:3001
// In production, we need to use the full backend URL
const getApiUrl = (): string => {
  const meta = import.meta as ImportMetaWithEnv;

  // Check if we're in development (Vite dev server)
  if (meta.env?.DEV) {
    // Vite proxy handles this, so use empty string
    return '';
  }

  // Production: use backend URL from env or empty (nginx proxy handles it)
  return meta.env?.VITE_API_URL || '';
};

export const API_URL = getApiUrl();

/**
 * Get the MCP endpoint base URL.
 * Handles Docker Hub setup where frontend (9630) and backend (9631) are on different ports.
 */
export const getMcpEndpointUrl = (): string => {
  // If API_URL is set (from VITE_API_URL), use it
  if (API_URL) {
    return API_URL;
  }

  // Fallback: detect Docker Hub setup (port 9630 -> 9631)
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // Docker Hub frontend runs on 9630, backend on 9631
    if (port === '9630') {
      return `${protocol}//${hostname}:9631`;
    }
  }

  // Default: relative URL (nginx proxy or dev server)
  return '';
};

/**
 * Get the full absolute MCP endpoint base URL for display purposes.
 * Always returns a complete URL (e.g., "http://localhost:3001") even in development.
 * Use this for displaying URLs to users (for copying to Cursor, Claude Code, etc.)
 */
export const getFullMcpEndpointUrl = (): string => {
  // If API_URL is set (from VITE_API_URL), use it
  if (API_URL) {
    return API_URL;
  }

  // Build full URL from window.location
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // Docker Hub frontend runs on 9630, backend on 9631
    if (port === '9630') {
      return `${protocol}//${hostname}:9631`;
    }

    // Development: frontend on 3000, backend on 3001
    if (port === '3000') {
      return `${protocol}//${hostname}:3001`;
    }

    // Same port (production with nginx proxy or custom setup)
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  // Fallback for SSR or non-browser environments
  return 'http://localhost:3001';
};

/**
 * Get the main gateway URL for MCP connections (internal use).
 * This endpoint proxies requests to the configured default profile.
 * The active profile can be changed via the settings API.
 * @returns The full URL to the gateway endpoint (e.g., "http://localhost:3001/api/mcp/gateway")
 */
export const getMainGatewayUrl = (): string => {
  return `${getMcpEndpointUrl()}/api/mcp/gateway`;
};

/**
 * Get the unified MCP endpoint URL for gateway.
 * Supports Streamable HTTP transport (2025-11-25):
 * - GET with Accept: text/event-stream → SSE notifications
 * - POST → JSON-RPC requests (tools/list, tools/call)
 * @returns Full absolute URL to the gateway endpoint
 */
export const getGatewayUrl = (): string => {
  return `${getFullMcpEndpointUrl()}/api/mcp/gateway`;
};

/**
 * Get the unified MCP endpoint URL for a specific profile.
 * Supports Streamable HTTP transport (2025-11-25):
 * - GET with Accept: text/event-stream → SSE notifications
 * - POST → JSON-RPC requests (tools/list, tools/call)
 * @param profileName - Name of the profile
 * @returns Full absolute URL to the profile endpoint
 */
export const getProfileUrl = (profileName: string): string => {
  return `${getFullMcpEndpointUrl()}/api/mcp/${profileName}`;
};
