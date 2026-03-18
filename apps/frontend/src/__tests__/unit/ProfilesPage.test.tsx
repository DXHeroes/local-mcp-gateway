/**
 * Tests for ProfilesPage component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { MemoryRouter } from 'react-router';
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

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );
    // Loading state shows skeleton UI (animate-pulse)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
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
      http.get(`${API_URL}/api/profiles/1/info`, () => {
        return HttpResponse.json({
          tools: [],
          serverStatus: { total: 0, connected: 0, servers: {} },
        });
      }),
      http.get('/api/profiles/1/info', () => {
        return HttpResponse.json({
          tools: [],
          serverStatus: { total: 0, connected: 0, servers: {} },
        });
      })
    );

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('test-profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Profile cards show server/tools status
    await waitFor(
      () => {
        expect(screen.getByText(/servers.*tools/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
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

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText('Loading profiles...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for empty state text to appear (Quick Start guide)
    await waitFor(
      () => {
        expect(screen.getByText(/Quick Start/i)).toBeInTheDocument();
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

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

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
        expect(screen.getByText(/Failed to fetch profiles/i)).toBeInTheDocument();
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

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Header has "New Profile" button, empty state has "Create First Profile"
      const newProfileBtn = screen.queryByText('New Profile');
      const createFirstBtn = screen.queryByText('Create First Profile');
      expect(newProfileBtn || createFirstBtn).toBeTruthy();
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
      http.get(`${API_URL}/api/profiles/1/info`, () => {
        return HttpResponse.json({
          tools: [],
          serverStatus: { total: 0, connected: 0, servers: {} },
        });
      }),
      http.get('/api/profiles/1/info', () => {
        return HttpResponse.json({
          tools: [],
          serverStatus: { total: 0, connected: 0, servers: {} },
        });
      })
    );

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

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

  it('should fetch profile info by profile id and show the matching tool count', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'alpha-profile',
        description: 'Alpha profile',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        name: 'beta-profile',
        description: 'Beta profile',
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
      http.get(`${API_URL}/api/profiles/1/info`, () => {
        return HttpResponse.json({
          tools: [{ name: 'tool-a' }, { name: 'tool-b' }],
          serverStatus: { total: 1, connected: 1, servers: {} },
        });
      }),
      http.get('/api/profiles/1/info', () => {
        return HttpResponse.json({
          tools: [{ name: 'tool-a' }, { name: 'tool-b' }],
          serverStatus: { total: 1, connected: 1, servers: {} },
        });
      }),
      http.get(`${API_URL}/api/profiles/2/info`, () => {
        return HttpResponse.json({
          tools: [{ name: 'tool-x' }],
          serverStatus: { total: 2, connected: 1, servers: {} },
        });
      }),
      http.get('/api/profiles/2/info', () => {
        return HttpResponse.json({
          tools: [{ name: 'tool-x' }],
          serverStatus: { total: 2, connected: 1, servers: {} },
        });
      })
    );

    render(
      <MemoryRouter>
        <ProfilesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('alpha-profile')).toBeInTheDocument();
      expect(screen.getByText('beta-profile')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('1/1 servers · 2 tools')).toBeInTheDocument();
      expect(screen.getByText('1/2 servers · 1 tools')).toBeInTheDocument();
    });
  });
});
