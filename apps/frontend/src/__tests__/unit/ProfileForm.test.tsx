/**
 * Tests for ProfileForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileForm from '../../components/ProfileForm';
import { server } from '../../test/server';

const API_URL = 'http://localhost:3001';

describe('ProfileForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    server.resetHandlers();
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
    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should render form in edit mode', async () => {
    const mockProfile = {
      id: '1',
      name: 'test-profile',
      description: 'Test description',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_URL}/api/profiles/1/servers`, () => {
        return HttpResponse.json({ serverIds: [] });
      })
    );

    const { container } = render(
      <ProfileForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('test-profile');
        expect(nameInput.disabled).toBe(true); // Name is disabled in edit mode
      },
      { timeout: 5000 }
    );

    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    expect(descInput.value).toBe('Test description');
  });

  it('should validate empty name', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(() => {
      expect(screen.getByText('Create Profile')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Wait for error message to appear in Alert
    await waitFor(
      async () => {
        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert).toHaveTextContent('Name is required');
      },
      { timeout: 5000 }
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate invalid name characters', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(() => {
      expect(screen.getByText('Create Profile')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'invalid name!');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Name must contain only alphanumeric characters, dashes, and underscores/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(() => {
      expect(screen.getByText('Create Profile')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-profile');

    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Test description');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'test-profile',
        description: 'Test description',
        serverIds: [],
      });
    });
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should load MCP servers for assignment', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'server-1',
        type: 'remote_http' as const,
      },
      {
        id: '2',
        name: 'server-2',
        type: 'remote_sse' as const,
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      })
    );

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('server-1')).toBeInTheDocument();
        expect(screen.getByText('server-2')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should handle server assignment', async () => {
    const user = userEvent.setup();

    const mockServers = [
      {
        id: '1',
        name: 'server-1',
        type: 'remote_http' as const,
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      })
    );

    mockOnSave.mockResolvedValue(undefined);

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('server-1')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-profile');

    const checkbox = screen.getByLabelText('server-1');
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'test-profile',
          description: undefined, // ProfileForm sends undefined for empty description
          serverIds: ['1'],
        });
      },
      { timeout: 5000 }
    );
  });

  it('should handle error on submit', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json([]);
      })
    );

    mockOnSave.mockRejectedValue(new Error('Failed to save profile'));

    const { container } = render(
      <ProfileForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    await waitFor(
      () => {
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'test-profile');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText('Failed to save profile')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should load assigned servers when editing', async () => {
    const mockProfile = {
      id: '1',
      name: 'test-profile',
      description: 'Test description',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const mockServers = [
      {
        id: '1',
        name: 'server-1',
        type: 'remote_http' as const,
      },
    ];

    server.use(
      http.get(`${API_URL}/api/mcp-servers`, () => {
        return HttpResponse.json(mockServers);
      }),
      http.get('/api/mcp-servers', () => {
        return HttpResponse.json(mockServers);
      }),
      http.get(`${API_URL}/api/profiles/1/servers`, () => {
        return HttpResponse.json({ serverIds: ['1'] });
      }),
      http.get('/api/profiles/1/servers', () => {
        return HttpResponse.json({ serverIds: ['1'] });
      })
    );

    const { container } = render(
      <ProfileForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    await waitForDialog();

    // Wait for servers to load first
    await waitFor(
      () => {
        expect(screen.getByText('server-1')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Then wait for checkbox to be checked (Radix UI uses data-state attribute)
    await waitFor(
      () => {
        const checkbox = screen.getByRole('checkbox', { name: 'server-1' });
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute('data-state', 'checked');
      },
      { timeout: 10000 }
    );
  });
});
