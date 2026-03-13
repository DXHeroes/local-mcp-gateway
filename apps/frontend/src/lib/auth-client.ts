/**
 * Better Auth React Client
 *
 * Provides authentication hooks and methods for the frontend.
 */

import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { getFullMcpEndpointUrl } from '../config/api';

export const authClient = createAuthClient({
  baseURL: getFullMcpEndpointUrl() || 'http://localhost:3001',
  basePath: '/api/auth',
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: 'include',
  },
});
