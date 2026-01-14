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
