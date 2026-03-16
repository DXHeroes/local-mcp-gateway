/**
 * Main App component
 *
 * Auth gate: user must be signed in to access the app.
 * Auth is always enabled with email+password as baseline.
 */

import { Toaster } from '@dxheroes/local-mcp-ui';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout.tsx';
import { getMcpAuthorizeUrl, hasMcpAuthQuery, isMcpLoginPath } from './lib/mcp-auth';
import { authClient } from './lib/auth-client';
import DebugLogsPage from './pages/DebugLogs.tsx';
import DocsPage from './pages/Docs.tsx';
import LoginPage from './pages/Login.tsx';
import McpServerDetailPage from './pages/McpServerDetail.tsx';
import McpServersPage from './pages/McpServers.tsx';
import InviteAcceptPage from './pages/InviteAccept.tsx';
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
            <Route
              path="/invite/:invitationId"
              element={
                <ErrorBoundary>
                  <InviteAcceptPage />
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
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const shouldResumeMcpAuth = isMcpLoginPath(pathname) && hasMcpAuthQuery(search);

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
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in" element={<LoginPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  if (shouldResumeMcpAuth) {
    window.location.replace(getMcpAuthorizeUrl(search));
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Continuing sign-in...</div>
      </div>
    );
  }

  // Invitation acceptance — bypass OrgGate (user may not have any org yet)
  if (pathname.startsWith('/invite/')) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/invite/:invitationId" element={<InviteAcceptPage />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // Authenticated — ensure active organization is set
  return (
    <ErrorBoundary>
      <OrgGate />
    </ErrorBoundary>
  );
}

/**
 * OrgPicker — shown when user belongs to multiple orgs and none is active.
 */
function OrgPicker({ organizations }: { organizations: { id: string; name: string; slug: string }[] }) {
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (orgId: string) => {
    setSelecting(orgId);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Select an Organization
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          You belong to multiple organizations. Choose one to continue.
        </p>
        <div className="space-y-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              disabled={selecting !== null}
              onClick={() => handleSelect(org.id)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <div className="text-left">
                <div className="font-medium text-gray-900">{org.name}</div>
                <div className="text-sm text-gray-500">{org.slug}</div>
              </div>
              <span className="text-sm text-blue-600 font-medium">
                {selecting === org.id ? 'Selecting...' : 'Select'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * OrgGate — ensures an active organization is set before rendering the app.
 * - Single org: auto-selects it
 * - Multiple orgs: shows OrgPicker
 * - Zero orgs: retries up to 3 times (race condition with async signup hook)
 */
function OrgGate() {
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();
  const { data: activeOrg, isPending: activeOrgLoading } = authClient.useActiveOrganization();
  const organizations = Array.isArray(orgs) ? orgs : [];
  const [setting, setSetting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Auto-select when exactly one org and no active org
  useEffect(() => {
    if (
      !orgsLoading &&
      !activeOrgLoading &&
      !activeOrg &&
      organizations.length === 1 &&
      !setting
    ) {
      const firstOrg = organizations[0];
      if (!firstOrg) return;
      setSetting(true);
      authClient.organization
        .setActive({ organizationId: firstOrg.id })
        .finally(() => setSetting(false));
    }
  }, [organizations, activeOrg, orgsLoading, activeOrgLoading, setting]);

  // Retry when zero orgs found (race condition with async signup hook)
  useEffect(() => {
    if (!orgsLoading && !activeOrgLoading && organizations.length === 0 && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [orgsLoading, activeOrgLoading, organizations.length, retryCount]);

  if (orgsLoading || activeOrgLoading || setting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading organization...</div>
      </div>
    );
  }

  // Still retrying — show loading
  if (organizations.length === 0 && retryCount < maxRetries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading organization...</div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No organizations found.</p>
          <p className="text-gray-400 text-xs mt-1">
            This shouldn&apos;t happen. Try signing out and back in.
          </p>
        </div>
      </div>
    );
  }

  // Multiple orgs, none active — show picker
  if (organizations.length > 1 && !activeOrg) {
    return <OrgPicker organizations={organizations} />;
  }

  if (!activeOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading organization...</div>
      </div>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
