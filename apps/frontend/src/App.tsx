/**
 * Main App component
 */

import { Toaster } from '@dxheroes/local-mcp-ui';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout.tsx';
import DebugLogsPage from './pages/DebugLogs.tsx';
import DocsPage from './pages/Docs.tsx';
import McpServerDetailPage from './pages/McpServerDetail.tsx';
import McpServersPage from './pages/McpServers.tsx';
import ProfileEditPage from './pages/ProfileEditPage.tsx';
import ProfilesPage from './pages/Profiles.tsx';

function App() {
  // Dynamically set favicon based on environment (port 3000 = dev, other = Docker)
  useEffect(() => {
    const isDev = window.location.port === '3000';
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = isDev ? '/favicon-dev.svg' : '/favicon-docker.svg';
    }
  }, []);

  return (
    <ErrorBoundary>
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
            </Routes>
          </ErrorBoundary>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
