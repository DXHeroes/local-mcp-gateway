/**
 * Tests for ProfilesPage component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import ProfilesPage from '../../pages/Profiles';
import { server } from '../../test/server';

const API_URL = 'http://localhost:3001';

describe('ProfilesPage', () => {
  beforeEach(() => {
    // Reset handlers before each test
    server.resetHandlers();
  });

  it('should show loading state initially', () => {
    // Delay response to see loading state
    server.use(
      http.get(`${API_URL}/api/profiles`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      })
    );

    render(<ProfilesPage />);
    expect(screen.getByText('Loading profiles...')).toBeInTheDocument();
  });

  it('should display profiles when loaded', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'test-profile',
        description: 'Test profile description',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json(mockProfiles);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json(mockProfiles);
      }),
      http.get(`${API_URL}/api/profiles/1/servers`, () => {
        return HttpResponse.json({ serverIds: [] });
      }),
      http.get('/api/profiles/1/servers', () => {
        return HttpResponse.json({ serverIds: [] });
      }),
      http.get(`${API_URL}/api/mcp/test-profile/info`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp/test-profile/info', () => {
        return HttpResponse.json({ tools: [] });
      })
    );

    render(<ProfilesPage />);

    await waitFor(
      () => {
        expect(screen.getByText('test-profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('Test profile description')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.getByText(/MCP Endpoint:/i)).toBeInTheDocument();
  });

  it('should display empty state when no profiles', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProfilesPage />);

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText('Loading profiles...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for empty state text to appear
    await waitFor(
      () => {
        expect(
          screen.getByText(/No profiles found. Create your first profile to get started./i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display error message on API failure', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );

    render(<ProfilesPage />);

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText('Loading profiles...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for error message to appear
    await waitFor(
      () => {
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display Create Profile button', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      // There are multiple "Create Profile" buttons (header + empty state)
      const buttons = screen.getAllByText('Create Profile');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('should display MCP endpoint URL for each profile', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'my-profile',
        description: 'My profile',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json(mockProfiles);
      }),
      http.get('/api/profiles', () => {
        return HttpResponse.json(mockProfiles);
      }),
      http.get(`${API_URL}/api/profiles/1/servers`, () => {
        return HttpResponse.json({ serverIds: [] });
      }),
      http.get('/api/profiles/1/servers', () => {
        return HttpResponse.json({ serverIds: [] });
      }),
      http.get(`${API_URL}/api/mcp/my-profile/info`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp/my-profile/info', () => {
        return HttpResponse.json({ tools: [] });
      })
    );

    render(<ProfilesPage />);

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText('Loading profiles...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for profile name to appear
    await waitFor(
      () => {
        expect(screen.getByText('my-profile')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // MCP endpoint URL is displayed in code element
    await waitFor(
      () => {
        const endpointCode = screen.getByText((content, element) => {
          const isCode = element?.tagName.toLowerCase() === 'code';
          const hasEndpoint =
            content.includes('/api/mcp/my-profile') || content.includes('api/mcp/my-profile');
          return isCode && hasEndpoint;
        });
        expect(endpointCode).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
