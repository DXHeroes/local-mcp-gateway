/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../../pages/Login';

const signInEmail = vi.fn();
const signInSocial = vi.fn();
const signUpEmail = vi.fn();

function mockAuthConfig(
  config: {
    emailAndPassword?: boolean;
    google?: boolean;
    signupMode?: 'open' | 'invite_only' | 'closed';
  } = {}
) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        emailAndPassword: config.emailAndPassword ?? true,
        google: config.google ?? true,
        signupMode: config.signupMode ?? 'open',
      }),
      { status: 200 }
    )
  );
}

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmail(...args),
      social: (...args: unknown[]) => signInSocial(...args),
    },
    signUp: {
      email: (...args: unknown[]) => signUpEmail(...args),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockAuthConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signInEmail.mockReset();
    signInSocial.mockReset();
    signUpEmail.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('preserves the MCP callback URL for Google sign-in flows', async () => {
    window.history.pushState(
      {},
      '',
      'http://localhost:3000/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code'
    );

    render(<LoginPage />);

    const googleButton = await screen.findByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL:
        'http://localhost:3000/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code',
    });
  });

  it('uses the frontend origin for the default Google callback URL', async () => {
    window.history.pushState({}, '', 'http://localhost:3000/sign-in');

    render(<LoginPage />);

    const googleButton = await screen.findByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: 'http://localhost:3000/',
    });
  });

  it('shows the backend error for failed email sign-in', async () => {
    signInEmail.mockResolvedValue({
      error: {
        message: 'Invalid email or password',
      },
    });

    render(<LoginPage />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('hides public sign-up when signup is invite-only', async () => {
    mockAuthConfig({ signupMode: 'invite_only' });

    render(<LoginPage />);

    expect(
      await screen.findByText(/account creation is available only through an invitation link/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
  });

  it('allows sign-up from an invitation link and forwards the invitation header', async () => {
    window.history.pushState({}, '', 'http://localhost:3000/invite/invite-123');
    mockAuthConfig({ signupMode: 'invite_only' });
    signUpEmail.mockResolvedValue({ data: { ok: true } });

    render(<LoginPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign up' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Invited User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invited@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(signUpEmail).toHaveBeenCalledWith(
        {
          name: 'Invited User',
          email: 'invited@example.com',
          password: 'password123',
        },
        {
          headers: {
            'X-Invitation-Id': 'invite-123',
          },
        }
      );
    });
  });
});
