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
