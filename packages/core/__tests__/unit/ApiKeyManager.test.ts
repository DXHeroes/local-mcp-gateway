import { beforeEach, describe, expect, it } from 'vitest';
import { ApiKeyManager, type ApiKeyRepository } from '../../src/abstractions/ApiKeyManager.js';
import type { ApiKeyConfig } from '../../src/types/mcp.js';

describe('ApiKeyManager', () => {
  let repository: ApiKeyRepository;
  let manager: ApiKeyManager;

  beforeEach(() => {
    const storage = new Map<string, ApiKeyConfig>();

    repository = {
      async store(mcpServerId, config) {
        storage.set(mcpServerId, config);
      },
      async get(mcpServerId) {
        return storage.get(mcpServerId) || null;
      },
      async delete(mcpServerId) {
        storage.delete(mcpServerId);
      },
    };

    manager = new ApiKeyManager(repository);
  });

  describe('store', () => {
    it('should store API key configuration', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'Authorization',
        headerValue: 'Bearer {apiKey}',
      };

      await manager.store('server1', config);
      const stored = await manager.get('server1');

      expect(stored).toBeDefined();
      expect(stored?.apiKey).toBe('test-api-key');
    });

    it('should reject empty API key', async () => {
      const config: ApiKeyConfig = {
        apiKey: '',
        headerName: 'Authorization',
        headerValue: 'Bearer {apiKey}',
      };

      await expect(manager.store('server1', config)).rejects.toThrow('cannot be empty');
    });

    it('should reject empty header name', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-key',
        headerName: '',
        headerValue: 'Bearer {apiKey}',
      };

      await expect(manager.store('server1', config)).rejects.toThrow('cannot be empty');
    });
  });

  describe('get', () => {
    it('should return API key configuration', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: '{apiKey}',
      };

      await manager.store('server1', config);
      const retrieved = await manager.get('server1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.apiKey).toBe('test-api-key');
    });

    it('should return null for non-existent server', async () => {
      const retrieved = await manager.get('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete API key', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'Authorization',
        headerValue: 'Bearer {apiKey}',
      };

      await manager.store('server1', config);
      await manager.delete('server1');

      const retrieved = await manager.get('server1');
      expect(retrieved).toBeNull();
    });
  });

  describe('formatHeaderValue', () => {
    it('should replace {apiKey} placeholder', () => {
      const result = manager.formatHeaderValue('Bearer {apiKey}', 'test-key');
      expect(result).toBe('Bearer test-key');
    });

    it('should handle multiple placeholders', () => {
      const result = manager.formatHeaderValue('{apiKey}:{apiKey}', 'test-key');
      expect(result).toBe('test-key:test-key');
    });

    it('should handle template without placeholder', () => {
      const result = manager.formatHeaderValue('static-value', 'test-key');
      expect(result).toBe('static-value');
    });
  });

  describe('injectHeaders', () => {
    it('should inject API key into headers', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'Authorization',
        headerValue: 'Bearer {apiKey}',
      };

      await manager.store('server1', config);
      const headers = await manager.injectHeaders('server1', {});

      expect(headers.Authorization).toBe('Bearer test-api-key');
    });

    it('should merge with existing headers', async () => {
      const config: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: '{apiKey}',
      };

      await manager.store('server1', config);
      const headers = await manager.injectHeaders('server1', {
        'Content-Type': 'application/json',
      });

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-API-Key']).toBe('test-api-key');
    });

    it('should return original headers if no API key', async () => {
      const originalHeaders = { 'Content-Type': 'application/json' };
      const headers = await manager.injectHeaders('non-existent', originalHeaders);

      expect(headers).toEqual(originalHeaders);
    });
  });
});
