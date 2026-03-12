import { describe, expect, it } from 'vitest';
import { resolveApiUrl } from '../../config/api';

describe('resolveApiUrl', () => {
  it('prefers the runtime API URL over the build-time value', () => {
    expect(
      resolveApiUrl(
        { API_URL: 'https://mcp.apps.dx.tools/' },
        {
          DEV: false,
          MODE: 'production',
          PROD: true,
          VITE_API_URL: 'https://build.example.com',
        }
      )
    ).toBe('https://mcp.apps.dx.tools');
  });

  it('uses the Vite proxy in development when runtime config is missing', () => {
    expect(
      resolveApiUrl(
        {},
        {
          DEV: true,
          MODE: 'development',
          PROD: false,
          VITE_API_URL: 'https://build.example.com',
        }
      )
    ).toBe('');
  });

  it('uses the build-time API URL in production when runtime config is missing', () => {
    expect(
      resolveApiUrl(
        {},
        {
          DEV: false,
          MODE: 'production',
          PROD: true,
          VITE_API_URL: 'https://build.example.com/',
        }
      )
    ).toBe('https://build.example.com');
  });

  it('returns an empty string when no API URL is configured', () => {
    expect(
      resolveApiUrl(
        {},
        {
          DEV: false,
          MODE: 'production',
          PROD: true,
        }
      )
    ).toBe('');
  });
});
