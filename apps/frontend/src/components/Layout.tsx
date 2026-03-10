/**
 * Layout component
 *
 * Navigation bar with user info and sign out when authenticated.
 */

import { LogOut, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { authClient } from '../lib/auth-client';

interface LayoutProps {
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
    isActive
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
  }`;

export default function Layout({ children }: LayoutProps) {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg font-semibold text-gray-900">Local MCP Gateway</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/profiles" className={navLinkClass}>
                  Profiles
                </NavLink>
                <NavLink to="/mcp-servers" className={navLinkClass}>
                  MCP Servers
                </NavLink>
                <NavLink to="/debug-logs" className={navLinkClass}>
                  Debug Logs
                </NavLink>
                <NavLink to="/docs" className={navLinkClass}>
                  Docs
                </NavLink>
                {session && (
                  <NavLink to="/organizations" className={navLinkClass}>
                    Organizations
                  </NavLink>
                )}
              </div>
            </div>

            {session && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 hidden md:inline">
                    {session.user.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
