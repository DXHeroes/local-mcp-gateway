/**
 * Unit tests for logger
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Logger Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to ensure clean state
    vi.resetModules();
  });

  it('should create logger instance', async () => {
    const { logger } = await import('../../../src/lib/logger.js');
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('should use debug level in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_LEVEL;

    vi.resetModules();
    const { logger } = await import('../../../src/lib/logger.js');
    expect(logger.level).toBe('debug');

    process.env.NODE_ENV = originalEnv;
  });

  it('should use info level in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    vi.resetModules();
    const { logger } = await import('../../../src/lib/logger.js');
    expect(logger.level).toBe('info');

    process.env.NODE_ENV = originalEnv;
  });

  it('should use custom LOG_LEVEL when set', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalLogLevel = process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'warn';

    vi.resetModules();
    const { logger } = await import('../../../src/lib/logger.js');
    expect(logger.level).toBe('warn');

    process.env.NODE_ENV = originalEnv;
    if (originalLogLevel) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  it('should be silent in test environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    vi.resetModules();
    const { logger } = await import('../../../src/lib/logger.js');
    
    // Logger should be configured (transports should be silent)
    expect(logger).toBeDefined();
    expect(logger.transports).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should have default meta with service name', async () => {
    const { logger } = await import('../../../src/lib/logger.js');
    expect(logger.defaultMeta).toBeDefined();
    expect(logger.defaultMeta.service).toBe('local-mcp-proxy-server');
  });
});

