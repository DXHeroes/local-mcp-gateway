/**
 * MCP Discovery Service
 *
 * Discovers MCP packages from dependencies with "mcpPackage": true.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DiscoveredMcpPackage, McpPackage } from '@dxheroes/local-mcp-core';
import { Injectable, Logger } from '@nestjs/common';

// ESM equivalents for __dirname and require.resolve
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[];
  mcpPackage?: boolean;
}

@Injectable()
export class McpDiscoveryService {
  private readonly logger = new Logger(McpDiscoveryService.name);

  /**
   * Discover all MCP packages from dependencies
   *
   * Strategy:
   * 1. Read backend's package.json dependencies (where MCP packages are listed)
   * 2. Also read root package.json dependencies as fallback
   * 3. Filter packages with "mcpPackage": true
   * 4. Import and validate each package
   */
  async discoverPackages(): Promise<DiscoveredMcpPackage[]> {
    const discovered: DiscoveredMcpPackage[] = [];
    const allDeps: Record<string, string> = {};

    try {
      // First, get the backend's package.json (where MCP packages are listed)
      const backendPkgPath = this.findBackendPackageJson();
      if (backendPkgPath) {
        const backendPkg = JSON.parse(readFileSync(backendPkgPath, 'utf-8')) as PackageJson;
        Object.assign(allDeps, backendPkg.dependencies, backendPkg.devDependencies);
        this.logger.debug(
          `Found backend package.json with ${Object.keys(allDeps).length} dependencies`
        );
      }

      // Also check root package.json for any global MCP packages
      const rootPkgPath = this.findRootPackageJson();
      const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8')) as PackageJson;
      Object.assign(allDeps, rootPkg.dependencies, rootPkg.devDependencies);

      for (const pkgName of Object.keys(allDeps)) {
        try {
          const result = await this.tryLoadMcpPackage(pkgName);
          if (result) {
            discovered.push(result);
          }
        } catch (error) {
          // Log errors for packages that look like MCP packages
          if (pkgName.includes('mcp-') || pkgName.includes('mcp/')) {
            this.logger.error(`Failed to load potential MCP package ${pkgName}: ${error}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to discover MCP packages: ${error}`);
    }

    return discovered;
  }

  private findBackendPackageJson(): string | null {
    // Look for package.json in the backend app directory
    // Start from __dirname (compiled location) and find src/../package.json
    const possiblePaths = [
      join(process.cwd(), 'apps', 'backend', 'package.json'),
      join(process.cwd(), 'package.json'), // If running from backend dir
      join(dirname(dirname(dirname(__dirname))), 'package.json'), // Relative from compiled dist
    ];

    for (const pkgPath of possiblePaths) {
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
          if (pkg.name === 'backend' || pkg.name === '@dxheroes/local-mcp-backend') {
            this.logger.debug(`Found backend package.json at: ${pkgPath}`);
            return pkgPath;
          }
        } catch {
          // Skip invalid files
        }
      }
    }
    return null;
  }

  private async tryLoadMcpPackage(pkgName: string): Promise<DiscoveredMcpPackage | null> {
    // Try to resolve the package's package.json
    const pkgJsonPath = this.resolvePackageJson(pkgName);
    if (!pkgJsonPath) return null;

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as PackageJson;

    // Check if this is an MCP package
    if (pkgJson.mcpPackage !== true) return null;

    this.logger.debug(`Found MCP package marker in: ${pkgName}`);

    // Import the package
    const packagePath = dirname(pkgJsonPath);
    const module = (await import(pkgName)) as Record<string, unknown>;

    // Validate the package exports
    const mcpPackage = this.validateMcpPackage(module, pkgName);
    if (!mcpPackage) return null;

    this.logger.log(`Successfully loaded MCP package: ${pkgName}`);

    return {
      packageName: pkgName,
      packagePath,
      package: mcpPackage,
    };
  }

  private validateMcpPackage(module: Record<string, unknown>, pkgName: string): McpPackage | null {
    // Try named export first
    let mcpPackage = module.mcpPackage as McpPackage | undefined;

    // Fall back to default export
    if (!mcpPackage) {
      mcpPackage = module.default as McpPackage | undefined;
    }

    if (!mcpPackage) {
      this.logger.warn(`Package ${pkgName} has mcpPackage=true but no valid export`);
      return null;
    }

    // Validate required fields
    if (!mcpPackage.metadata?.id || !mcpPackage.metadata?.name || !mcpPackage.createServer) {
      this.logger.warn(
        `Package ${pkgName} missing required fields (metadata.id, metadata.name, createServer)`
      );
      return null;
    }

    return mcpPackage;
  }

  private findRootPackageJson(): string {
    // Start from current directory and go up
    let dir = process.cwd();
    while (dir !== '/') {
      const pkgPath = join(dir, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
        // Check if this is the monorepo root
        if (pkg.workspaces || pkg.name === 'local-mcp-gateway') {
          return pkgPath;
        }
      }
      dir = dirname(dir);
    }
    throw new Error('Could not find root package.json');
  }

  private resolvePackageJson(pkgName: string): string | null {
    try {
      // Try to find package.json using require.resolve
      const mainPath = require.resolve(pkgName);
      this.logger.debug(`Resolved ${pkgName} to: ${mainPath}`);
      let dir = dirname(mainPath);

      // Walk up to find package.json
      while (dir !== '/') {
        const pkgPath = join(dir, 'package.json');
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
          if (pkg.name === pkgName) {
            this.logger.debug(`Found package.json for ${pkgName} at: ${pkgPath}`);
            return pkgPath;
          }
        }
        dir = dirname(dir);
      }
      this.logger.debug(`Could not find package.json for: ${pkgName}`);
      return null;
    } catch (error) {
      // Only log for packages that look like MCP packages (start with @dxheroes/mcp-)
      if (pkgName.includes('mcp-')) {
        this.logger.debug(`Could not resolve ${pkgName}: ${error}`);
      }
      return null;
    }
  }
}
