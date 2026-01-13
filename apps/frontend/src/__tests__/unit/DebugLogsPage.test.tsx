/**
 * Tests for DebugLogsPage component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
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
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/debug/logs`, () => {
        return HttpResponse.json([]);
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
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/debug/logs`, () => {
        return HttpResponse.json([]);
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
});
