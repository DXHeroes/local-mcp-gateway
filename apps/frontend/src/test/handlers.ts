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

  http.get(`${API_URL}/api/mcp/:profileName/info`, () => {
    return HttpResponse.json({ tools: [] });
  }),
  http.get('/api/mcp/:profileName/info', () => {
    return HttpResponse.json({ tools: [] });
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
    return HttpResponse.json([]);
  }),
  http.get('/api/debug/logs', () => {
    return HttpResponse.json([]);
  }),
];
