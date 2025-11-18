/**
 * Vitest setup file
 */

/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server';

// Mock ResizeObserver before any imports
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
} as unknown as typeof ResizeObserver;

// Mock PointerEvent API for Radix UI Select
global.Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
global.Element.prototype.setPointerCapture = vi.fn();
global.Element.prototype.releasePointerCapture = vi.fn();

// Mock scrollIntoView for Radix UI Select
global.Element.prototype.scrollIntoView = vi.fn();

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
