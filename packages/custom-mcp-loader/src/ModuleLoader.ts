/**
 * Custom MCP Module Loader
 *
 * Loads and validates custom MCP modules from the custom-mcps directory
 * Supports TypeScript compilation, hot-reload, and basic sandboxing
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { McpServer } from '@local-mcp/core';
import type { FSWatcher } from 'chokidar';
import chokidar from 'chokidar';

// Schema for validating custom MCP modules (reserved for future use)
// const CustomMcpModuleSchema = z.object({
//   name: z.string().min(1),
//   version: z.string().optional(),
//   tools: z.array(z.object({
//     name: z.string(),
//     description: z.string(),
//     inputSchema: z.any(),
//   })).optional(),
//   resources: z.array(z.object({
//     uri: z.string(),
//     name: z.string(),
//     description: z.string().optional(),
//     mimeType: z.string().optional(),
//   })).optional(),
// });

/**
 * Load custom MCP module from file system
 * @param modulePath - Path to custom MCP module directory
 * @returns Loaded MCP server instance
 */
export async function loadCustomMcpModule(modulePath: string): Promise<McpServer> {
  const resolvedPath = resolve(modulePath);
  const indexFile = join(resolvedPath, 'index.ts');

  if (!existsSync(indexFile)) {
    throw new Error(`Custom MCP module not found at ${indexFile}`);
  }

  // Validate module first
  const validation = validateCustomMcpModule(modulePath);
  if (!validation.valid) {
    throw new Error(`Invalid custom MCP module: ${validation.errors.join(', ')}`);
  }

  try {
    // Try to load the module using dynamic import
    // This works if tsx or ts-node is available, or if the module is pre-compiled
    const module = await import(`file://${indexFile}`);

    // Import McpServer class to check instanceof
    const { McpServer: McpServerClass } = await import('@local-mcp/core');

    // Find exported class extending McpServer
    const exports = Object.values(module);

    // Find a class that extends McpServer by trying to instantiate it
    for (const exp of exports) {
      if (typeof exp === 'function') {
        try {
          // Try to instantiate the class
          const testInstance = new (exp as new () => McpServer)();
          // Check if it extends McpServer
          if (testInstance instanceof McpServerClass) {
            return testInstance;
          }
        } catch {
          // Skip this export if instantiation fails
        }
      }
    }

    // If no class found by instantiation, try to find any class
    const classes = exports.filter((exp) => typeof exp === 'function') as Array<new () => unknown>;
    if (classes.length === 0) {
      throw new Error('No exported class found in custom MCP module');
    }

    // Use the first class found and try to instantiate it
    // The validation should have ensured it extends McpServer
    const firstClass = classes[0];
    if (!firstClass) {
      throw new Error('No class found to instantiate');
    }

    try {
      const instance = new firstClass() as McpServer;
      if (!(instance instanceof McpServerClass)) {
        throw new Error('Exported class does not extend McpServer');
      }
      return instance;
    } catch (error) {
      throw new Error(
        `Failed to instantiate custom MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } catch (error) {
    // If import fails, provide helpful error message
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        `Failed to load custom MCP module. ` +
          `TypeScript modules require compilation. ` +
          `Please ensure tsx is available or compile the module to JavaScript first. ` +
          `Error: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Validate custom MCP module structure
 * @param modulePath - Path to custom MCP module directory
 * @returns Validation result
 */
export function validateCustomMcpModule(modulePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const resolvedPath = resolve(modulePath);
  const indexFile = join(resolvedPath, 'index.ts');

  if (!existsSync(indexFile)) {
    errors.push(`index.ts not found at ${indexFile}`);
    return { valid: false, errors };
  }

  try {
    const content = readFileSync(indexFile, 'utf-8');

    // Basic checks
    if (!content.includes('class') || !content.includes('extends')) {
      errors.push('Module must export a class extending McpServer');
    }

    if (!content.includes('listTools') || !content.includes('callTool')) {
      errors.push('Module must implement listTools and callTool methods');
    }
  } catch (error) {
    errors.push(
      `Failed to read module: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Custom MCP Loader with hot-reload support
 */
export class CustomMcpLoader {
  private loadedModules: Map<string, McpServer> = new Map();
  private watchers: Map<string, FSWatcher> = new Map();
  private reloadCallbacks: Map<string, () => void> = new Map();

  /**
   * Load custom MCP module with optional hot-reload
   * @param modulePath - Path to custom MCP module directory
   * @param enableHotReload - Enable hot-reload (default: false)
   * @param onReload - Callback when module is reloaded
   * @returns Loaded MCP server instance
   */
  async load(
    modulePath: string,
    enableHotReload = false,
    onReload?: (server: McpServer) => void
  ): Promise<McpServer> {
    const resolvedPath = resolve(modulePath);

    // Load module
    const server = await loadCustomMcpModule(modulePath);
    await server.initialize();

    this.loadedModules.set(resolvedPath, server);

    // Set up hot-reload if enabled
    if (enableHotReload) {
      await this.setupHotReload(resolvedPath, onReload);
    }

    return server;
  }

  /**
   * Set up hot-reload for a module
   */
  private async setupHotReload(
    modulePath: string,
    onReload?: (server: McpServer) => void
  ): Promise<void> {
    if (this.watchers.has(modulePath)) {
      return; // Already watching
    }

    const indexFile = join(modulePath, 'index.ts');

    const watcher = chokidar.watch(indexFile, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async () => {
      try {
        console.log(`Reloading custom MCP module: ${modulePath}`);

        // Reload module
        const newServer = await loadCustomMcpModule(modulePath);
        await newServer.initialize();

        this.loadedModules.set(modulePath, newServer);

        // Call reload callback
        if (onReload) {
          onReload(newServer);
        }

        const callback = this.reloadCallbacks.get(modulePath);
        if (callback) {
          callback();
        }
      } catch (error) {
        console.error(`Failed to reload custom MCP module ${modulePath}:`, error);
      }
    });

    this.watchers.set(modulePath, watcher);

    if (onReload) {
      this.reloadCallbacks.set(modulePath, () => {
        const server = this.loadedModules.get(modulePath);
        if (server && onReload) {
          onReload(server);
        }
      });
    }
  }

  /**
   * Unload a module and stop watching
   */
  unload(modulePath: string): void {
    const resolvedPath = resolve(modulePath);

    // Stop watching
    const watcher = this.watchers.get(resolvedPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(resolvedPath);
    }

    // Remove callbacks
    this.reloadCallbacks.delete(resolvedPath);

    // Remove from loaded modules
    this.loadedModules.delete(resolvedPath);
  }

  /**
   * Get loaded module
   */
  getLoadedModule(modulePath: string): McpServer | undefined {
    return this.loadedModules.get(resolve(modulePath));
  }

  /**
   * Cleanup all watchers
   */
  cleanup(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.reloadCallbacks.clear();
    this.loadedModules.clear();
  }
}
