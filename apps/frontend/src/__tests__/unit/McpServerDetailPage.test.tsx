/**
 * Tests for McpServerDetailPage debug log visibility copy
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import McpServerDetailPage from '../../pages/McpServerDetail';
import { server } from '../../test/server';

const API_URL = 'http://localhost:3001';

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}));

vi.mock('../../components/ShareModal', () => ({
  default: () => null,
}));

describe('McpServerDetailPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('explains that aggregated profile logs may appear outside the server detail view', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers/server-1`, () => {
        return HttpResponse.json({
          id: 'server-1',
          name: 'Server One',
          type: 'external',
          config: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }),
      http.get('/api/mcp-servers/server-1', () => {
        return HttpResponse.json({
          id: 'server-1',
          name: 'Server One',
          type: 'external',
          config: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }),
      http.get(`${API_URL}/api/mcp-servers/server-1/tools`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp-servers/server-1/tools', () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get(`${API_URL}/api/mcp-servers/server-1/tool-configs`, () => {
        return HttpResponse.json({ tools: [], hasConfigs: false });
      }),
      http.get('/api/mcp-servers/server-1/tool-configs', () => {
        return HttpResponse.json({ tools: [], hasConfigs: false });
      }),
      http.get(`${API_URL}/api/mcp-servers/server-1/status`, () => {
        return HttpResponse.json({ status: 'connected', error: null, oauthRequired: false });
      }),
      http.get('/api/mcp-servers/server-1/status', () => {
        return HttpResponse.json({ status: 'connected', error: null, oauthRequired: false });
      }),
      http.get(`${API_URL}/api/debug/logs`, () => {
        return HttpResponse.json({
          logs: [],
          total: 0,
          limit: 50,
          offset: 0,
        });
      }),
      http.get('/api/debug/logs', () => {
        return HttpResponse.json({
          logs: [],
          total: 0,
          limit: 50,
          offset: 0,
        });
      })
    );

    render(
      <MemoryRouter initialEntries={['/mcp-servers/server-1']}>
        <Routes>
          <Route path="/mcp-servers/:id" element={<McpServerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading server details...')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /aggregated profile requests such as tools\/list appear in the debug logs page/i
      )
    ).toBeInTheDocument();
  });
});
