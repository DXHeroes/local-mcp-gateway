/**
 * Tests for McpRegistry
 *
 * Covers register, get, getDiscovered, getAll, getAllDiscovered,
 * has, and getAllMetadata.
 */

import type { DiscoveredMcpPackage, McpPackage } from '@dxheroes/local-mcp-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';

/** Helper to create a mock McpPackage with the given id */
function createMockPackage(id: string, overrides?: Partial<McpPackage['metadata']>): McpPackage {
  return {
    metadata: {
      id,
      name: `${id}-name`,
      description: `Description for ${id}`,
      version: '1.0.0',
      requiresApiKey: false,
      apiKeyHint: undefined,
      requiresOAuth: false,
      tags: ['test'],
      icon: undefined,
      docsUrl: undefined,
      ...overrides,
    },
    createServer: () => ({}) as any,
  };
}

/** Helper to create a mock DiscoveredMcpPackage */
function createDiscovered(
  id: string,
  overrides?: Partial<McpPackage['metadata']>
): DiscoveredMcpPackage {
  return {
    packageName: `@dxheroes/mcp-${id}`,
    packagePath: `/packages/mcp-${id}`,
    package: createMockPackage(id, overrides),
  };
}

describe('McpRegistry', () => {
  let registry: McpRegistry;

  beforeEach(() => {
    registry = new McpRegistry();
  });

  // ── register ────────────────────────────────────────────────────────

  describe('register', () => {
    it('adds a package that can be retrieved by id', () => {
      const discovered = createDiscovered('alpha');

      registry.register(discovered);

      expect(registry.has('alpha')).toBe(true);
      expect(registry.get('alpha')).toBe(discovered.package);
    });

    it('overwrites a previously registered package with the same id', () => {
      const first = createDiscovered('alpha');
      const second = createDiscovered('alpha', { version: '2.0.0' });

      registry.register(first);
      registry.register(second);

      expect(registry.get('alpha')?.metadata.version).toBe('2.0.0');
      expect(registry.getAll()).toHaveLength(1);
    });
  });

  // ── get ─────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the McpPackage for a known id', () => {
      const discovered = createDiscovered('beta');
      registry.register(discovered);

      const result = registry.get('beta');

      expect(result).toBe(discovered.package);
    });

    it('returns undefined for an unknown id', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  // ── getDiscovered ───────────────────────────────────────────────────

  describe('getDiscovered', () => {
    it('returns the full DiscoveredMcpPackage for a known id', () => {
      const discovered = createDiscovered('gamma');
      registry.register(discovered);

      const result = registry.getDiscovered('gamma');

      expect(result).toBe(discovered);
      expect(result?.packageName).toBe('@dxheroes/mcp-gamma');
      expect(result?.packagePath).toBe('/packages/mcp-gamma');
    });

    it('returns undefined for an unknown id', () => {
      expect(registry.getDiscovered('nonexistent')).toBeUndefined();
    });
  });

  // ── getAll ──────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns empty array when nothing is registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('returns all registered McpPackage objects', () => {
      registry.register(createDiscovered('one'));
      registry.register(createDiscovered('two'));
      registry.register(createDiscovered('three'));

      const all = registry.getAll();

      expect(all).toHaveLength(3);
      const ids = all.map((p) => p.metadata.id);
      expect(ids).toContain('one');
      expect(ids).toContain('two');
      expect(ids).toContain('three');
    });
  });

  // ── getAllDiscovered ────────────────────────────────────────────────

  describe('getAllDiscovered', () => {
    it('returns empty array when nothing is registered', () => {
      expect(registry.getAllDiscovered()).toEqual([]);
    });

    it('returns all DiscoveredMcpPackage objects with package paths', () => {
      registry.register(createDiscovered('one'));
      registry.register(createDiscovered('two'));

      const all = registry.getAllDiscovered();

      expect(all).toHaveLength(2);
      expect(all[0].packageName).toBeDefined();
      expect(all[0].packagePath).toBeDefined();
      expect(all[0].package).toBeDefined();
    });
  });

  // ── has ─────────────────────────────────────────────────────────────

  describe('has', () => {
    it('returns true for a registered id', () => {
      registry.register(createDiscovered('exists'));

      expect(registry.has('exists')).toBe(true);
    });

    it('returns false for an unregistered id', () => {
      expect(registry.has('missing')).toBe(false);
    });
  });

  // ── getAllMetadata ──────────────────────────────────────────────────

  describe('getAllMetadata', () => {
    it('returns empty array when nothing is registered', () => {
      expect(registry.getAllMetadata()).toEqual([]);
    });

    it('maps packages to metadata objects with correct fields', () => {
      registry.register(
        createDiscovered('rich', {
          name: 'Rich Package',
          description: 'A richly configured package',
          version: '3.2.1',
          requiresApiKey: true,
          apiKeyHint: 'Get key at https://example.com',
          requiresOAuth: true,
          tags: ['ai', 'search'],
          icon: 'magnifier',
          docsUrl: 'https://docs.example.com',
        })
      );

      const metadata = registry.getAllMetadata();

      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({
        id: 'rich',
        name: 'Rich Package',
        description: 'A richly configured package',
        version: '3.2.1',
        requiresApiKey: true,
        apiKeyHint: 'Get key at https://example.com',
        requiresOAuth: true,
        tags: ['ai', 'search'],
        icon: 'magnifier',
        docsUrl: 'https://docs.example.com',
      });
    });

    it('does not include non-metadata fields like createServer or seed', () => {
      registry.register(createDiscovered('simple'));

      const metadata = registry.getAllMetadata();

      expect(metadata[0]).not.toHaveProperty('createServer');
      expect(metadata[0]).not.toHaveProperty('seed');
      expect(metadata[0]).not.toHaveProperty('packageName');
      expect(metadata[0]).not.toHaveProperty('packagePath');
    });

    it('returns metadata for multiple packages', () => {
      registry.register(createDiscovered('a'));
      registry.register(createDiscovered('b'));
      registry.register(createDiscovered('c'));

      const metadata = registry.getAllMetadata();

      expect(metadata).toHaveLength(3);
      const ids = metadata.map((m) => m.id);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });
  });
});
