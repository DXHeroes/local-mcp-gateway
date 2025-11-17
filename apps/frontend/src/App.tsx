/**
 * Main App component
 */

import { Toaster } from '@local-mcp/ui';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout.tsx';
import DebugLogsPage from './pages/DebugLogs.tsx';
import McpServerDetailPage from './pages/McpServerDetail.tsx';
import McpServersPage from './pages/McpServers.tsx';
import ProfilesPage from './pages/Profiles.tsx';

function App() {
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
            </Routes>
          </ErrorBoundary>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
