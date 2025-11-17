/**
 * Unit tests for ModuleLoader
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateCustomMcpModule } from '../../src/ModuleLoader.js';

describe('ModuleLoader', () => {
  const testDir = join(tmpdir(), 'mcp-loader-test');

  describe('validateCustomMcpModule', () => {
    beforeEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
    });

    it('should return errors when index.ts does not exist', () => {
      const result = validateCustomMcpModule(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate module with correct structure', () => {
      const indexContent = `
        import { McpServer } from '@local-mcp/core';
        
        export class MyMcp extends McpServer {
          async listTools() {
            return [];
          }
          async callTool(name: string, args: unknown) {
            return {};
          }
          async listResources() {
            return [];
          }
          async readResource(uri: string) {
            return {};
          }
        }
      `;
      writeFileSync(join(testDir, 'index.ts'), indexContent);

      const result = validateCustomMcpModule(testDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid module structure', () => {
      writeFileSync(join(testDir, 'index.ts'), 'export const invalid = true;');

      const result = validateCustomMcpModule(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
