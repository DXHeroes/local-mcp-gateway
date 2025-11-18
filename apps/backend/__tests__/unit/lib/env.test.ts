/**
 * Unit tests for env.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Env Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should return environment variables', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.DATABASE_PATH = '/test/db.sqlite';

    const { getEnv } = await import('../../../src/lib/env.js');
    const env = getEnv();

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_PATH).toBe('/test/db.sqlite');
  });

  it('should use default values when environment variables are not set', async () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DATABASE_PATH;

    const { getEnv } = await import('../../../src/lib/env.js');
    const env = getEnv();

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
  });

  it('should parse PORT as number', async () => {
    process.env.PORT = '8080';

    const { getEnv } = await import('../../../src/lib/env.js');
    const env = getEnv();

    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe('number');
  });

  it('should handle invalid PORT value', async () => {
    process.env.PORT = 'invalid';

    const { getEnv } = await import('../../../src/lib/env.js');
    expect(() => getEnv()).toThrow();
  });

  it('should cache validated environment', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';

    const { getEnv } = await import('../../../src/lib/env.js');
    const env1 = getEnv();
    const env2 = getEnv();

    expect(env1).toBe(env2);
  });

  it('should handle validation errors with ZodError', async () => {
    process.env.NODE_ENV = 'invalid-env';
    process.env.PORT = '-1';

    const { getEnv } = await import('../../../src/lib/env.js');
    expect(() => getEnv()).toThrow('Invalid environment variables');
  });
});

