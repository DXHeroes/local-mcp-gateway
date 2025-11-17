/**
 * Tests for DebugLogsPage component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DebugLogsPage from '../../pages/DebugLogs';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DebugLogsPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the debug logs page', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<DebugLogsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
  });

  it('should display placeholder message when no logs', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<DebugLogsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading debug logs...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No debug logs found.')).toBeInTheDocument();
  });
});
