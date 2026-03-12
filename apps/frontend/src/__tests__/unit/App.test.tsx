/**
 * Tests for App component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

// Mock the auth client — session null = unauthenticated
const mockUseSession = vi.fn().mockReturnValue({
  data: null,
  isPending: false,
});
const mockUseListOrganizations = vi.fn().mockReturnValue({
  data: [],
  isPending: false,
});
const mockUseActiveOrganization = vi.fn().mockReturnValue({
  data: null,
  isPending: false,
});

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    useListOrganizations: () => mockUseListOrganizations(),
    useActiveOrganization: () => mockUseActiveOrganization(),
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
  mockUseListOrganizations.mockReturnValue({ data: [], isPending: false });
  mockUseActiveOrganization.mockReturnValue({ data: null, isPending: false });
  window.history.replaceState({}, '', '/');
});

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ emailAndPassword: true, google: false }), { status: 200 })
      )
    );
  });

  it('should show login page when not authenticated', async () => {
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
    mockUseListOrganizations.mockReturnValue({
      data: [{ id: 'org-1', name: 'Test Org' }],
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      data: { id: 'org-1', name: 'Test Org' },
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

  it('should render the login page on the dedicated sign-in route', async () => {
    window.history.pushState({}, '', '/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  it('should resume MCP authorization after login succeeds on the sign-in route', async () => {
    window.history.pushState(
      {},
      '',
      'http://localhost:3000/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code'
    );

    const originalLocation = window.location;
    const replaceSpy = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/sign-in',
        search: '?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code',
        replace: replaceSpy,
      },
    });

    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'test', name: 'Test User', email: 'test@test.com' },
        session: { id: 'sess-1', userId: 'test' },
      },
      isPending: false,
    });
    mockUseListOrganizations.mockReturnValue({
      data: [{ id: 'org-1', name: 'Test Org' }],
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      data: { id: 'org-1', name: 'Test Org' },
      isPending: false,
    });

    render(<App />);

    expect(screen.getByText('Continuing sign-in...')).toBeInTheDocument();
    expect(replaceSpy).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/mcp/authorize?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code'
    );

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
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
