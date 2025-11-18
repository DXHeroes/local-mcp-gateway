/**
 * Tests for McpServerForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import McpServerForm from '../../components/McpServerForm';

describe('McpServerForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
    mockOnOpenChange.mockClear();
  });

  // Helper to wait for Dialog Portal to render
  const waitForDialog = async () => {
    // Wait for dialog to be visible using findByRole (waits automatically)
    const dialog = await screen.findByRole('dialog', {}, { timeout: 10000 });
    expect(dialog).toBeInTheDocument();
    // Check if dialog is visible (not hidden)
    const style = window.getComputedStyle(dialog);
    expect(style.display).not.toBe('none');
    expect(style.visibility).not.toBe('hidden');
  };

  it('should render form in create mode', async () => {
    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Add MCP Server')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(document.getElementById('server-url')).toBeInTheDocument();
  });

  it('should render form in edit mode', async () => {
    const mockServer = {
      id: '1',
      name: 'test-server',
      type: 'remote_http' as const,
      config: { url: 'https://example.com/mcp' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const { container } = render(
      <McpServerForm
        server={mockServer}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText('Edit MCP Server')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('test-server');
      },
      { timeout: 3000 }
    );

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    expect(urlInput.value).toBe('https://example.com/mcp');
  });

  it('should allow selecting server type', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitFor(
      () => {
        const dialog = container.querySelector('[role="dialog"]') || document.body.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const typeSelect = screen.getByLabelText(/type/i);
    await user.click(typeSelect);

    // Wait for Select dropdown to open and find option by role
    await waitFor(
      () => {
        expect(screen.getByRole('option', { name: 'Remote SSE' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const sseOption = screen.getByRole('option', { name: 'Remote SSE' });
    await user.click(sseOption);

    // Verify SSE option is selected (check combobox value)
    await waitFor(
      () => {
        const combobox = screen.getByRole('combobox', { name: /type/i });
        expect(combobox).toHaveTextContent('Remote SSE');
      },
      { timeout: 5000 }
    );
  });

  it('should validate empty name', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitFor(
      () => {
        const dialog = container.querySelector('[role="dialog"]') || document.body.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate empty URL', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitFor(
      () => {
        const dialog = container.querySelector('[role="dialog"]') || document.body.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      async () => {
        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert).toHaveTextContent('URL is required');
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate invalid URL format', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitFor(
      () => {
        const dialog = container.querySelector('[role="dialog"]') || document.body.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'invalid-url');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      async () => {
        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert).toHaveTextContent('Invalid URL format');
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should display OAuth configuration fields when OAuth is selected', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const oauthRadio = screen.getByLabelText(/oauth authentication/i);
    await user.click(oauthRadio);

    await waitFor(
      () => {
        expect(screen.getByLabelText(/authorization server url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/client id/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/scopes/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should validate OAuth configuration', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com');

    const oauthRadio = screen.getByLabelText(/oauth authentication/i);
    await user.click(oauthRadio);

    await waitFor(
      () => {
        expect(screen.getByLabelText(/authorization server url/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      async () => {
        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert).toHaveTextContent(/OAuth authorization server URL is required when OAuth is enabled/i);
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should display API key configuration fields when API key is selected', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const apiKeyRadio = screen.getByLabelText(/api key authentication/i);
    await user.click(apiKeyRadio);

    await waitFor(
      () => {
        expect(document.getElementById('api-key')).toBeInTheDocument();
        expect(screen.getByLabelText(/header name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/header value template/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should validate API key configuration', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com');

    const apiKeyRadio = screen.getByLabelText(/api key authentication/i);
    await user.click(apiKeyRadio);

    await waitFor(
      () => {
        expect(document.getElementById('api-key')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      async () => {
        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert).toHaveTextContent(/API key is required when API key authentication is enabled/i);
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should submit form with HTTP server data', async () => {
    const user = userEvent.setup();

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com/mcp');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'test-server',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          oauthConfig: undefined,
          apiKeyConfig: undefined,
        });
      },
      { timeout: 5000 }
    );
  });

  it('should submit form with SSE server data', async () => {
    const user = userEvent.setup();

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const typeSelect = screen.getByLabelText(/type/i);
    await user.click(typeSelect);

    // Wait for Select dropdown to open and find option by role
    await waitFor(
      () => {
        expect(screen.getByRole('option', { name: 'Remote SSE' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const sseOption = screen.getByRole('option', { name: 'Remote SSE' });
    await user.click(sseOption);

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com/mcp/sse');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'test-server',
          type: 'remote_sse',
          config: {
            url: 'https://example.com/mcp/sse',
            transport: 'sse',
          },
          oauthConfig: undefined,
          apiKeyConfig: undefined,
        });
      },
      { timeout: 5000 }
    );
  });

  it('should submit form with OAuth configuration', async () => {
    const user = userEvent.setup();

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com/mcp');

    const oauthRadio = screen.getByLabelText(/oauth authentication/i);
    await user.click(oauthRadio);

    await waitFor(() => {
      expect(screen.getByLabelText(/authorization server url/i)).toBeInTheDocument();
    });

    const authUrlInput = screen.getByLabelText(/authorization server url/i);
    await user.type(authUrlInput, 'https://oauth.example.com/authorize');

    const clientIdInput = screen.getByLabelText(/client id/i);
    await user.type(clientIdInput, 'client-id-123');

    const scopesInput = screen.getByLabelText(/scopes/i);
    await user.type(scopesInput, 'read write');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'test-server',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          oauthConfig: {
            authorizationServerUrl: 'https://oauth.example.com/authorize',
            tokenEndpoint: undefined,
            resource: undefined,
            scopes: ['read', 'write'],
            requiresOAuth: true,
            callbackUrl: undefined,
            clientId: 'client-id-123',
            clientSecret: undefined,
          },
          apiKeyConfig: undefined,
        });
      },
      { timeout: 5000 }
    );
  });

  it('should submit form with API key configuration', async () => {
    const user = userEvent.setup();

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com/mcp');

    const apiKeyRadio = screen.getByLabelText(/api key authentication/i);
    await user.click(apiKeyRadio);

    await waitFor(
      () => {
        expect(document.getElementById('api-key')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    await user.type(apiKeyInput, 'secret-api-key');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'test-server',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          oauthConfig: undefined,
          apiKeyConfig: {
            apiKey: 'secret-api-key',
            headerName: 'Authorization',
            headerValue: 'Bearer {apiKey}',
          },
        });
      },
      { timeout: 5000 }
    );
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle error on submit', async () => {
    const user = userEvent.setup();

    mockOnSave.mockRejectedValue(new Error('Failed to save MCP server'));

    const { container } = render(
      <McpServerForm
        server={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-server');

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    await user.type(urlInput, 'https://example.com/mcp');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save MCP server')).toBeInTheDocument();
    });
  });

  it('should load server data when editing', async () => {
    const mockServer = {
      id: '1',
      name: 'test-server',
      type: 'remote_http' as const,
      config: { url: 'https://example.com/mcp' },
      oauthConfig: {
        authorizationServerUrl: 'https://oauth.example.com',
        scopes: ['read'],
        requiresOAuth: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const { container } = render(
      <McpServerForm
        server={mockServer}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Edit MCP Server')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('test-server');
      },
      { timeout: 5000 }
    );

    const urlInput = document.getElementById('server-url') as HTMLInputElement;
    expect(urlInput.value).toBe('https://example.com/mcp');

    // OAuth fields should be visible
    await waitFor(
      () => {
        expect(screen.getByLabelText(/authorization server url/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const authUrlInput = screen.getByLabelText(/authorization server url/i) as HTMLInputElement;
    expect(authUrlInput.value).toBe('https://oauth.example.com');
  });
});

