/**
 * Tests for App component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

// Mock the auth client — session null = unauthenticated
const mockUseSession = vi.fn().mockReturnValue({
  data: null,
  isPending: false,
});

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    useListOrganizations: () => ({
      data: [],
      isPending: false,
    }),
    useActiveOrganization: () => ({
      data: null,
    }),
    signOut: vi.fn(),
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  mockUseSession.mockReturnValue({ data: null, isPending: false });
});

describe('App', () => {
  it('should show login page when not authenticated', async () => {
    // Mock fetch for auth config endpoint
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ emailAndPassword: true, google: false }), { status: 200 })
    );

    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByText('Local MCP Gateway')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Should show login page elements
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should render the app when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'test', name: 'Test User', email: 'test@test.com' },
        session: { id: 'sess-1', userId: 'test' },
      },
      isPending: false,
    });

    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByText('Profiles')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Local MCP Gateway')).toBeInTheDocument();
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
  });

  it('should show loading state while session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
