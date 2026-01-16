/**
 * Layout component
 */

import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

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
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
