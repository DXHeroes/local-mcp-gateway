import { API_URL } from '../config/api';

/**
 * Wrapper around fetch that automatically includes credentials
 * for cross-origin API calls (needed when frontend and backend
 * are on different domains, e.g. Coolify standalone deployment).
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
  });
}
