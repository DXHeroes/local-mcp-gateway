/**
 * Tests for DebugLogsPage component
 */

/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import DebugLogsPage from '../../pages/DebugLogs';
import { server } from '../../test/server';

const API_URL = 'http://localhost:3001';

describe('DebugLogsPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should render the debug logs page', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      }),
      http.get(/.*\/api\/debug\/logs.*/, () => {
        return HttpResponse.json({
          logs: [],
          total: 0,
          page: 1,
          limit: 100,
          totalPages: 1,
        });
      })
    );

    render(<DebugLogsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
  });

  it('should display placeholder message when no logs', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      }),
      http.get(/.*\/api\/debug\/logs.*/, () => {
        return HttpResponse.json({
          logs: [],
          total: 0,
          page: 1,
          limit: 100,
          totalPages: 1,
        });
      })
    );

    render(<DebugLogsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /No debug logs found. Debug logs viewer will display logs here when they are available./i
      )
    ).toBeInTheDocument();
  });

  it('renders pagination controls from API metadata', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      }),
      http.get(/.*\/api\/debug\/logs.*/, () => {
        return HttpResponse.json({
          logs: [
            {
              id: 'log-1',
              profileId: 'profile-1',
              requestType: 'tools/list',
              requestPayload: '{}',
              status: 'success',
              createdAt: Date.now(),
            },
          ],
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 3,
        });
      })
    );

    render(<DebugLogsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('Profile')).toHaveLength(2);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('sends page and limit params, then resets page to 1 when filters change', async () => {
    const requests: Array<Record<string, string>> = [];

    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([{ id: 'profile-1', name: 'Profile One' }]);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json([{ id: 'profile-1', name: 'Profile One' }]);
      }),
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([{ id: 'server-1', name: 'Server One' }]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([{ id: 'server-1', name: 'Server One' }]);
      }),
      http.get(/.*\/api\/debug\/logs.*/, ({ request }) => {
        const url = new URL(request.url);
        requests.push(Object.fromEntries(url.searchParams.entries()));

        const page = Number(url.searchParams.get('page') ?? '1');

        return HttpResponse.json({
          logs: [
            {
              id: `log-${page}`,
              profileId: 'profile-1',
              mcpServerId: 'server-1',
              requestType: url.searchParams.get('requestType') ?? 'tools/list',
              requestPayload: '{}',
              status: url.searchParams.get('status') ?? 'success',
              createdAt: Date.now(),
            },
          ],
          total: 3,
          page,
          limit: Number(url.searchParams.get('limit') ?? '100'),
          totalPages: 3,
        });
      })
    );

    render(<DebugLogsPage />);

    await waitFor(() => {
      expect(requests.length).toBeGreaterThan(0);
    });

    expect(requests[0]).toMatchObject({
      page: '1',
      limit: '100',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    expect(requests.at(-1)).toMatchObject({
      page: '2',
      limit: '100',
    });

    fireEvent.change(screen.getByLabelText('Request Type'), {
      target: { value: 'tools/call' },
    });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    expect(requests.at(-1)).toMatchObject({
      page: '1',
      limit: '100',
      requestType: 'tools/call',
    });
  });
});
