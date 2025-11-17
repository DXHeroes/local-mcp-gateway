/**
 * Tests for Layout component
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Layout from '../../components/Layout';

describe('Layout', () => {
  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Local MCP Proxy')).toBeInTheDocument();
    expect(screen.getByText('Profiles')).toBeInTheDocument();
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const profilesLink = screen.getByText('Profiles').closest('a');
    const serversLink = screen.getByText('MCP Servers').closest('a');
    const logsLink = screen.getByText('Debug Logs').closest('a');

    expect(profilesLink).toHaveAttribute('href', '/profiles');
    expect(serversLink).toHaveAttribute('href', '/mcp-servers');
    expect(logsLink).toHaveAttribute('href', '/debug-logs');
  });
});
