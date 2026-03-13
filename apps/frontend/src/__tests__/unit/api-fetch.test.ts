import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the api config module before importing apiFetch
vi.mock('../../config/api', () => ({
  API_URL: 'https://mcp.apps.dx.tools',
}));

import { apiFetch } from '../../lib/api-fetch';

describe('apiFetch', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prepends API_URL to the path', async () => {
    await apiFetch('/api/profiles');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mcp.apps.dx.tools/api/profiles',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('always includes credentials: include', async () => {
    await apiFetch('/api/profiles');

    const [, init] = mockFetch.mock.calls[0];
    expect(init.credentials).toBe('include');
  });

  it('passes through other RequestInit options', async () => {
    await apiFetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mcp.apps.dx.tools/api/profiles',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"test"}',
        credentials: 'include',
      })
    );
  });

  it('overrides credentials even if caller passes a different value', async () => {
    await apiFetch('/api/test', { credentials: 'omit' } as RequestInit);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.credentials).toBe('include');
  });
});
