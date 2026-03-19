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

  const summaryPayload = {
    overview: {
      totalLogs: 12,
      successCount: 9,
      errorCount: 2,
      pendingCount: 1,
      errorRate: 16.7,
      avgDurationMs: 143,
      p95DurationMs: 520,
      uniqueProfiles: 2,
      uniqueServers: 3,
    },
    timeBucket: 'hour',
    timeseries: [
      {
        timestamp: '2026-03-18T08:00:00.000Z',
        total: 5,
        success: 4,
        error: 1,
        pending: 0,
      },
    ],
    statusBreakdown: [
      { status: 'success', count: 9 },
      { status: 'error', count: 2 },
      { status: 'pending', count: 1 },
    ],
    requestTypeBreakdown: [
      { requestType: 'tools/list', count: 7, errorRate: 0, avgDurationMs: 80 },
      { requestType: 'status/check', count: 3, errorRate: 33.3, avgDurationMs: 260 },
      { requestType: 'tools/call', count: 2, errorRate: 50, avgDurationMs: 420 },
    ],
    serverBreakdown: [
      { mcpServerId: null, name: 'Aggregated profile request', count: 4, errorRate: 0, avgDurationMs: 95 },
      { mcpServerId: 'server-1', name: 'Server One', count: 8, errorRate: 25, avgDurationMs: 180 },
    ],
    latencyBuckets: [
      { label: '0-100ms', count: 5 },
      { label: '100-500ms', count: 4 },
      { label: '500ms-1s', count: 2 },
      { label: '1s+', count: 1 },
    ],
  };

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
      http.get(/.*\/api\/debug\/logs\/summary.*/, () => {
        return HttpResponse.json(summaryPayload);
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
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByText('Log Pulse')).toBeInTheDocument();
    expect(screen.getByText('12', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('P95 Latency')).toBeInTheDocument();
  });

  it('should display placeholder message for events when no logs are returned', async () => {
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
      http.get(/.*\/api\/debug\/logs\/summary.*/, () => {
        return HttpResponse.json(summaryPayload);
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

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Events' }));

    expect(
      screen.getByText(
        /No debug logs found. Debug logs viewer will display logs here when they are available./i
      )
    ).toBeInTheDocument();
  });

  it('renders pagination controls from API metadata on the events tab', async () => {
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
      http.get(/.*\/api\/debug\/logs\/summary.*/, () => {
        return HttpResponse.json(summaryPayload);
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

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Events' }));

    expect(screen.getAllByText('Profile')).toHaveLength(2);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('sends shared filters to logs and summary, then resets events pagination when filters change', async () => {
    const logRequests: Array<Record<string, string>> = [];
    const summaryRequests: Array<Record<string, string>> = [];

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
      http.get(/.*\/api\/debug\/logs\/summary.*/, ({ request }) => {
        const url = new URL(request.url);
        summaryRequests.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json(summaryPayload);
      }),
      http.get(/.*\/api\/debug\/logs.*/, ({ request }) => {
        const url = new URL(request.url);
        logRequests.push(Object.fromEntries(url.searchParams.entries()));

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
      expect(logRequests.length).toBeGreaterThan(0);
      expect(summaryRequests.length).toBeGreaterThan(0);
    });

    expect(logRequests[0]).toMatchObject({
      page: '1',
      limit: '100',
    });
    expect(summaryRequests[0]).toEqual({});

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Events' }));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    expect(logRequests.at(-1)).toMatchObject({
      page: '2',
      limit: '100',
    });

    fireEvent.change(screen.getByLabelText('Request Type'), {
      target: { value: 'status/check' },
    });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    expect(logRequests.at(-1)).toMatchObject({
      page: '1',
      limit: '100',
      requestType: 'status/check',
    });
    expect(summaryRequests.at(-1)).toMatchObject({
      requestType: 'status/check',
    });
  });

  it('builds request type options dynamically from summary data', async () => {
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
      http.get(/.*\/api\/debug\/logs\/summary.*/, () => {
        return HttpResponse.json(summaryPayload);
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

    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toContain('status/check');
    expect(options).toContain('tools/list');
  });

  it('keeps request and response payloads collapsed until expanded', async () => {
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
      http.get(/.*\/api\/debug\/logs\/summary.*/, () => {
        return HttpResponse.json(summaryPayload);
      }),
      http.get(/.*\/api\/debug\/logs.*/, () => {
        return HttpResponse.json({
          logs: [
            {
              id: 'log-expanded',
              profileId: 'profile-1',
              requestType: 'tools/call',
              requestPayload: '{"foo":"bar"}',
              responsePayload: '{"ok":true}',
              status: 'success',
              createdAt: Date.now(),
            },
          ],
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        });
      })
    );

    render(<DebugLogsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Events' }));

    expect(screen.queryByText(/"foo": "bar"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"ok": true/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Request/ }));
    expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Response/ }));
    expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
  });
});
