/**
 * Tests for McpServersPage component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import McpServersPage from '../../pages/McpServers';
import { server } from '../../test/server';

const API_URL = 'http://localhost:3001';

describe('McpServersPage', () => {
  beforeEach(() => {
    // Reset handlers before each test
    server.resetHandlers();
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('should show loading state initially', () => {
    // Delay response to see loading state
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading MCP servers...')).toBeInTheDocument();
  });

  it('should display servers when loaded', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      }),
      http.get(`${API_URL}/api/mcp-servers/1/tools`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp-servers/1/tools', () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get(`${API_URL}/api/mcp-servers/1/status`, () => {
        return HttpResponse.json({ status: 'connected', error: null });
      }),
      http.get('/api/mcp-servers/1/status', () => {
        return HttpResponse.json({ status: 'connected', error: null });
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('test-server')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    expect(screen.getByText(/Type: remote_http/i)).toBeInTheDocument();
  });

  it('should display empty state when no servers', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(/No MCP servers found. Create your first MCP server to get started./i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display error message on API failure', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.queryByText('Loading MCP servers...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display Add MCP Server button', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText('Loading MCP servers...')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Then check for button (there are multiple buttons with this text, use getAllByText)
    await waitFor(() => {
      const buttons = screen.getAllByText('Add MCP Server');
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toBeInTheDocument();
    });
  });

  it('should display OAuth configuration when present', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'oauth-server',
        type: 'remote_http',
        config: {},
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read', 'write'],
          requiresOAuth: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      }),
      http.get(`${API_URL}/api/mcp-servers/1/tools`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp-servers/1/tools', () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get(`${API_URL}/api/mcp-servers/1/status`, () => {
        return HttpResponse.json({ status: 'connected', error: null });
      }),
      http.get('/api/mcp-servers/1/status', () => {
        return HttpResponse.json({ status: 'connected', error: null });
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('oauth-server')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    expect(screen.getByText(/OAuth Configuration/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Authorization Server: https:\/\/oauth.example.com/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Authorize')).toBeInTheDocument();
  });

  it('should display API key configuration when present', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'api-key-server',
        type: 'remote_http',
        config: {},
        apiKeyConfig: {
          apiKey: 'secret-key',
          headerName: 'X-API-Key',
          headerValue: 'secret-key',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      }),
      http.get(`${API_URL}/api/mcp-servers/1/tools`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp-servers/1/tools', () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get(`${API_URL}/api/mcp-servers/1/status`, () => {
        return HttpResponse.json({ status: 'connected', error: null });
      }),
      http.get('/api/mcp-servers/1/status', () => {
        return HttpResponse.json({ status: 'connected', error: null });
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('api-key-server')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    expect(screen.getByText(/API Key Configured/i)).toBeInTheDocument();
    expect(screen.getByText(/Header: X-API-Key/i)).toBeInTheDocument();
  });

  it('should open OAuth authorization window when Authorize button is clicked', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'oauth-server',
        type: 'remote_http',
        config: {},
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read'],
          requiresOAuth: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      }),
      http.get(`${API_URL}/api/mcp-servers/1/tools`, () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get('/api/mcp-servers/1/tools', () => {
        return HttpResponse.json({ tools: [] });
      }),
      http.get(`${API_URL}/api/mcp-servers/1/status`, () => {
        return HttpResponse.json({ status: 'connected', error: null });
      }),
      http.get('/api/mcp-servers/1/status', () => {
        return HttpResponse.json({ status: 'connected', error: null });
      })
    );

    render(
      <MemoryRouter>
        <McpServersPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('Authorize')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const authorizeButton = screen.getByText('Authorize');
    authorizeButton.click();

    // API_URL is empty string in component, so URL is relative
    expect(window.open).toHaveBeenCalledWith(
      '/api/oauth/authorize/1',
      '_blank',
      'width=600,height=700'
    );
  });
});
