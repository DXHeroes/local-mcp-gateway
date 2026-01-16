/**
 * Tests for App component
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
// React import needed for JSX (even with new JSX transform)
// biome-ignore lint/correctness/noUnusedImports: JSX requires React in scope
import React from 'react';
import { describe, expect, it } from 'vitest';
import App from '../../App';

describe('App', () => {
  it('should render the app with router', () => {
    render(<App />);

    // Check if navigation is rendered
    expect(screen.getByText('Local MCP Gateway')).toBeInTheDocument();
    expect(screen.getByText('Profiles')).toBeInTheDocument();
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
  });

  it('should render Profiles page by default', () => {
    render(<App />);

    // Profiles page should be rendered (either skeleton UI or page heading)
    // Check for skeleton loading state or page heading
    const skeletonUI = document.querySelector('.animate-pulse');
    const pageHeading = screen.queryByRole('heading', { name: /Profiles/i });
    expect(skeletonUI || pageHeading).toBeTruthy();
  });
});
