/**
 * Tests for ProfilesPage component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
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
        description: 'Test description',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json(mockProfiles);
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText('test-profile')).toBeInTheDocument();
    });

    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText(/MCP Endpoint:/i)).toBeInTheDocument();
  });

  it('should display empty state when no profiles', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/No profiles found. Create your first profile to get started./i)
      ).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('should display Create Profile button', async () => {
    server.use(
      http.get(`${API_URL}/api/profiles`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Profile')).toBeInTheDocument();
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
      })
    );

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText('my-profile')).toBeInTheDocument();
    });

    const endpointCode = screen.getByText(`${API_URL}/api/mcp/my-profile`);
    expect(endpointCode).toBeInTheDocument();
  });
});
