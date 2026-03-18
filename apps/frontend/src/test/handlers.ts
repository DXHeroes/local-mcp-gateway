/**
 * MSW handlers for API mocking in tests
 */

import { HttpResponse, http } from 'msw';

const API_URL = 'http://localhost:3001';

export const handlers = [
  // Profiles API - support both relative and absolute URLs
  // Default: return empty array (tests will override with server.use() when needed)
  http.get(`${API_URL}/api/profiles`, () => {
    return HttpResponse.json([]);
  }),
  http.get('/api/profiles', () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_URL}/api/profiles/:id/servers`, () => {
    return HttpResponse.json({ serverIds: [] });
  }),
  http.get('/api/profiles/:id/servers', () => {
    return HttpResponse.json({ serverIds: [] });
  }),

  http.get(`${API_URL}/api/profiles/:id/info`, () => {
    return HttpResponse.json({
      tools: [],
      serverStatus: { total: 0, connected: 0, servers: {} },
    });
  }),
  http.get('/api/profiles/:id/info', () => {
    return HttpResponse.json({
      tools: [],
      serverStatus: { total: 0, connected: 0, servers: {} },
    });
  }),

  // MCP Presets API
  http.get(`${API_URL}/api/mcp-servers/presets`, () => {
    return HttpResponse.json([]);
  }),
  http.get('/api/mcp-servers/presets', () => {
    return HttpResponse.json([]);
  }),

  // MCP Servers API - support both relative and absolute URLs
  // Default: return empty array (tests will override with server.use() when needed)
  http.get(`${API_URL}/api/mcp-servers`, () => {
    return HttpResponse.json([]);
  }),
  http.get('/api/mcp-servers', () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_URL}/api/mcp-servers/:id/tools`, () => {
    return HttpResponse.json({ tools: [] });
  }),
  http.get('/api/mcp-servers/:id/tools', () => {
    return HttpResponse.json({ tools: [] });
  }),

  http.get(`${API_URL}/api/mcp-servers/:id/status`, () => {
    return HttpResponse.json({ status: 'connected', error: null });
  }),
  http.get('/api/mcp-servers/:id/status', () => {
    return HttpResponse.json({ status: 'connected', error: null });
  }),

  // Debug Logs API - support both relative and absolute URLs
  http.get(`${API_URL}/api/debug/logs`, () => {
    return HttpResponse.json({ logs: [], total: 0, page: 1, limit: 100, totalPages: 1, offset: 0 });
  }),
  http.get('/api/debug/logs', () => {
    return HttpResponse.json({ logs: [], total: 0, page: 1, limit: 100, totalPages: 1, offset: 0 });
  }),

  // Sharing summary API
  http.get(`${API_URL}/api/sharing/summary/:resourceType`, () => {
    return HttpResponse.json({});
  }),
  http.get('/api/sharing/summary/:resourceType', () => {
    return HttpResponse.json({});
  }),

  // Settings API
  http.get(`${API_URL}/api/settings/default-gateway-profile`, () => {
    return HttpResponse.json({ profileName: null });
  }),
  http.get('/api/settings/default-gateway-profile', () => {
    return HttpResponse.json({ profileName: null });
  }),
  http.put(`${API_URL}/api/settings/default-gateway-profile`, async () => {
    return HttpResponse.json({ success: true });
  }),
  http.put('/api/settings/default-gateway-profile', async () => {
    return HttpResponse.json({ success: true });
  }),
];
