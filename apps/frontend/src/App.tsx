/**
 * Main App component
 *
 * Auth gate: user must be signed in to access the app.
 * Auth is always enabled with email+password as baseline.
 */

import { Toaster } from '@dxheroes/local-mcp-ui';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout.tsx';
import { authClient } from './lib/auth-client';
import DebugLogsPage from './pages/DebugLogs.tsx';
import DocsPage from './pages/Docs.tsx';
import LoginPage from './pages/Login.tsx';
import McpServerDetailPage from './pages/McpServerDetail.tsx';
import McpServersPage from './pages/McpServers.tsx';
import OrganizationsPage from './pages/Organizations.tsx';
import ProfileEditPage from './pages/ProfileEditPage.tsx';
import ProfilesPage from './pages/Profiles.tsx';

function AuthenticatedApp() {
  // Dynamically set favicon based on environment (port 3000 = dev, other = Docker)
  useEffect(() => {
    const isDev = window.location.port === '3000';
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = isDev ? '/favicon-dev.svg' : '/favicon-docker.svg';
    }
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <ProfilesPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/profiles"
              element={
                <ErrorBoundary>
                  <ProfilesPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/profiles/:profileId/edit"
              element={
                <ErrorBoundary>
                  <ProfileEditPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/mcp-servers"
              element={
                <ErrorBoundary>
                  <McpServersPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/mcp-servers/:id"
              element={
                <ErrorBoundary>
                  <McpServerDetailPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/debug-logs"
              element={
                <ErrorBoundary>
                  <DebugLogsPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/docs"
              element={
                <ErrorBoundary>
                  <DocsPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/organizations"
              element={
                <ErrorBoundary>
                  <OrganizationsPage />
                </ErrorBoundary>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}

function App() {
  const { data: session, isPending } = authClient.useSession();

  // Still loading session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Not signed in — show login
  if (!session) {
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    );
  }

  // Authenticated
  return (
    <ErrorBoundary>
      <AuthenticatedApp />
    </ErrorBoundary>
  );
}

export default App;
