/**
 * MCP Registry
 *
 * In-memory registry of discovered MCP packages.
 */

import { Injectable } from '@nestjs/common';
import type { McpPackage, DiscoveredMcpPackage } from '@dxheroes/local-mcp-core';

@Injectable()
export class McpRegistry {
  private readonly packages = new Map<string, DiscoveredMcpPackage>();

  /**
   * Register a discovered MCP package
   */
  register(pkg: DiscoveredMcpPackage): void {
    this.packages.set(pkg.package.metadata.id, pkg);
  }

  /**
   * Get a package by its ID
   */
  get(id: string): McpPackage | undefined {
    return this.packages.get(id)?.package;
  }

  /**
   * Get full discovered package info by ID
   */
  getDiscovered(id: string): DiscoveredMcpPackage | undefined {
    return this.packages.get(id);
  }

  /**
   * Get all registered packages
   */
  getAll(): McpPackage[] {
    return Array.from(this.packages.values()).map((p) => p.package);
  }

  /**
   * Get all discovered packages
   */
  getAllDiscovered(): DiscoveredMcpPackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * Check if a package is registered
   */
  has(id: string): boolean {
    return this.packages.has(id);
  }

  /**
   * Get package metadata for UI
   */
  getAllMetadata() {
    return this.getAll().map((pkg) => ({
      id: pkg.metadata.id,
      name: pkg.metadata.name,
      description: pkg.metadata.description,
      version: pkg.metadata.version,
      requiresApiKey: pkg.metadata.requiresApiKey,
      apiKeyHint: pkg.metadata.apiKeyHint,
      requiresOAuth: pkg.metadata.requiresOAuth,
      tags: pkg.metadata.tags,
      icon: pkg.metadata.icon,
      docsUrl: pkg.metadata.docsUrl,
    }));
  }
}
