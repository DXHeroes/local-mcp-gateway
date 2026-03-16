/**
 * Login Page
 *
 * Shows email+password sign-in/sign-up form (when enabled via AUTH_EMAIL_PASSWORD)
 * and Google sign-in button when Google OAuth is configured.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';
import { authClient } from '../lib/auth-client';
import { hasMcpAuthQuery, isMcpLoginPath } from '../lib/mcp-auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [emailPasswordEnabled, setEmailPasswordEnabled] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const fetchAuthConfig = useCallback(() => {
    setBackendError(false);
    setConfigLoaded(false);
    apiFetch('/api/health/auth-config')
      .then((res) => {
        if (!res.ok) {
          setBackendError(true);
          return;
        }
        return res.json();
      })
      .then((config) => {
        if (!config) return;
        setGoogleEnabled(config.google === true);
        setEmailPasswordEnabled(config.emailAndPassword !== false);
        setConfigLoaded(true);
      })
      .catch(() => {
        setBackendError(true);
      });
  }, []);

  useEffect(() => {
    fetchAuthConfig();
  }, [fetchAuthConfig]);

  const callbackPath =
    typeof window !== 'undefined' &&
    isMcpLoginPath(window.location.pathname) &&
    hasMcpAuthQuery(window.location.search)
      ? `${window.location.pathname}${window.location.search}`
      : typeof window !== 'undefined' && window.location.pathname.startsWith('/invite/')
        ? window.location.pathname
        : '/';

  const callbackURL =
    typeof window !== 'undefined' ? `${window.location.origin}${callbackPath}` : callbackPath;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || 'Sign in failed');
      }
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message || 'Sign up failed');
      }
    } catch {
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });
  };

  if (backendError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Server Unavailable</h1>
          <p className="text-gray-500 mb-6">
            The backend server is not responding. Please make sure it is running and try again.
          </p>
          <button
            type="button"
            onClick={fetchAuthConfig}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
          Local MCP Gateway
        </h1>
        <p className="text-gray-500 mb-8 text-center">
          {mode === 'signin'
            ? 'Sign in to manage your MCP servers and profiles'
            : 'Create an account to get started'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {configLoaded && !emailPasswordEnabled && !googleEnabled && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm text-center">
            No login methods are configured. Please contact an administrator.
          </div>
        )}

        {emailPasswordEnabled && (
          <>
            <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp}>
              {mode === 'signup' && (
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              {mode === 'signin' ? (
                <p className="text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {googleEnabled && (
          <>
            {emailPasswordEnabled && (
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-4 text-sm text-gray-400">or</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
