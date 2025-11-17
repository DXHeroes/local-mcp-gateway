/**
 * MSW handlers for API mocking in tests
 */

import { HttpResponse, http } from 'msw';

const API_URL = 'http://localhost:3001';

export const handlers = [
  // Profiles API
  http.get(`${API_URL}/api/profiles`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'test-profile',
        description: 'Test profile description',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
  }),

  // MCP Servers API
  http.get(`${API_URL}/api/mcp-servers`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'test-server',
        type: 'http',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
  }),
];
