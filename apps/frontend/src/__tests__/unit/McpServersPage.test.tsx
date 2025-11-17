/**
 * Tests for McpServersPage component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
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
      })
    );

    render(<McpServersPage />);
    expect(screen.getByText('Loading MCP servers...')).toBeInTheDocument();
  });

  it('should display servers when loaded', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'test-server',
        type: 'http',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText('test-server')).toBeInTheDocument();
    });

    expect(screen.getByText(/Type: http/i)).toBeInTheDocument();
  });

  it('should display empty state when no servers', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/No MCP servers found. Add your first MCP server to get started./i)
      ).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('should display Add MCP Server button', async () => {
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText('Add MCP Server')).toBeInTheDocument();
    });
  });

  it('should display OAuth configuration when present', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'oauth-server',
        type: 'http',
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
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText('oauth-server')).toBeInTheDocument();
    });

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
        type: 'http',
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
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText('api-key-server')).toBeInTheDocument();
    });

    expect(screen.getByText(/API Key Configured/i)).toBeInTheDocument();
    expect(screen.getByText(/Header: X-API-Key/i)).toBeInTheDocument();
  });

  it('should open OAuth authorization window when Authorize button is clicked', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'oauth-server',
        type: 'http',
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
      })
    );

    render(<McpServersPage />);

    await waitFor(() => {
      expect(screen.getByText('Authorize')).toBeInTheDocument();
    });

    const authorizeButton = screen.getByText('Authorize');
    authorizeButton.click();

    expect(window.open).toHaveBeenCalledWith(
      `${API_URL}/api/oauth/authorize/1`,
      '_blank',
      'width=600,height=700'
    );
  });
});
