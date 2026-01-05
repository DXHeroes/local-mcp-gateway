/**
 * Profile Tools Routes
 *
 * API endpoints for managing MCP tool customizations per profile
 */

import type { ProfileManager } from '@dxheroes/local-mcp-core';
import type {
  ProfileMcpServerToolRepository,
  McpServerToolsCacheRepository,
  McpServerRepository,
  OAuthTokenRepository,
} from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';
import { McpServerFactory } from '@dxheroes/local-mcp-core';
import { McpServerToolsCacheRepository as CacheRepo } from '@dxheroes/local-mcp-database';

const toolCustomizationSchema = z.object({
  toolName: z.string(),
  isEnabled: z.boolean(),
  customName: z.string().optional(),
  customDescription: z.string().optional(),
  customInputSchema: z.any().optional(),
});

const bulkUpdateToolsSchema = z.object({
  tools: z.array(toolCustomizationSchema),
});

export function createProfileToolsRoutes(
  profileManager: ProfileManager,
  mcpServerRepository: McpServerRepository,
  profileMcpServerToolRepository: ProfileMcpServerToolRepository,
  mcpServerToolsCacheRepository: McpServerToolsCacheRepository,
  oauthTokenRepository: OAuthTokenRepository
): Router {
  const router = Router({ mergeParams: true });

  /**
   * GET /api/profiles/:profileId/servers/:serverId/tools
   * Get tools with customizations and change detection
   */
  router.get('/tools', async (req, res) => {
    const { profileId, serverId } = req.params as { profileId: string; serverId: string };
    const forceRefresh = req.query.refresh === 'true';

    try {
      // Validate profile exists
      const profile = await profileManager.getById(profileId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Validate server exists
      const server = await mcpServerRepository.findById(serverId);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // 1. Fetch remote tools (with optional caching)
      const remoteTools = await fetchRemoteTools(
        server,
        mcpServerToolsCacheRepository,
        oauthTokenRepository,
        forceRefresh
      );

      // 2. Fetch cached tools (for diff detection)
      const cachedTools = await mcpServerToolsCacheRepository.findByServer(serverId);

      // 3. Fetch customizations
      const customizations = await profileMcpServerToolRepository.findByProfileAndServer(
        profileId,
        serverId
      );

      // 4. Merge data
      const merged = mergeToolsWithCustomizations(remoteTools, cachedTools, customizations);

      // 5. Update cache if refresh was requested
      if (forceRefresh) {
        await mcpServerToolsCacheRepository.bulkUpsert(serverId, remoteTools);
      }

      res.json({ tools: merged });
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      res.status(500).json({
        error: 'Failed to fetch tools',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/profiles/:profileId/servers/:serverId/tools
   * Bulk update tool customizations
   */
  router.put('/tools', async (req, res) => {
    const { profileId, serverId } = req.params as { profileId: string; serverId: string };

    try {
      const validated = bulkUpdateToolsSchema.parse(req.body);

      // Validate profile exists
      const profile = await profileManager.getById(profileId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Validate server exists
      const server = await mcpServerRepository.findById(serverId);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // Bulk upsert customizations
      await profileMcpServerToolRepository.bulkUpsert(
        validated.tools.map((tool) => ({
          profileId,
          mcpServerId: serverId,
          toolName: tool.toolName,
          isEnabled: tool.isEnabled,
          customName: tool.customName,
          customDescription: tool.customDescription,
          customInputSchema: tool.customInputSchema,
        }))
      );

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      console.error('Failed to update tools:', error);
      res.status(500).json({
        error: 'Failed to update tools',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/profiles/:profileId/servers/:serverId/tools/check-changes
   * Check for changes in remote server
   */
  router.post('/tools/check-changes', async (req, res) => {
    const { serverId } = req.params as { profileId: string; serverId: string };

    try {
      // Validate server exists
      const server = await mcpServerRepository.findById(serverId);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // Fetch remote tools (force refresh)
      const remoteTools = await fetchRemoteTools(
        server,
        mcpServerToolsCacheRepository,
        oauthTokenRepository,
        true
      );

      // Fetch cached tools
      const cachedTools = await mcpServerToolsCacheRepository.findByServer(serverId);

      // Detect changes
      const changes = detectChanges(remoteTools, cachedTools);

      res.json(changes);
    } catch (error) {
      console.error('Failed to check changes:', error);
      res.status(500).json({
        error: 'Failed to check changes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

// Helper functions

/**
 * Fetch remote tools from MCP server
 */
async function fetchRemoteTools(
  server: any,
  cacheRepository: McpServerToolsCacheRepository,
  oauthTokenRepository: OAuthTokenRepository,
  forceRefresh: boolean
): Promise<Array<{ name: string; description?: string; inputSchema?: unknown }>> {
  // If not forcing refresh, check cache TTL (5 minutes)
  if (!forceRefresh) {
    const cached = await cacheRepository.findByServer(server.id);
    if (cached.length > 0 && cached[0]) {
      const now = Date.now();
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      const cacheAge = now - cached[0].fetchedAt;

      if (cacheAge < CACHE_TTL_MS) {
        // Use cache
        return cached.map((c) => ({
          name: c.toolName,
          description: c.description || undefined,
          inputSchema: c.inputSchema,
        }));
      }
    }
  }

  // Fetch from remote
  const oauthToken = await oauthTokenRepository.get(server.id);
  const serverInstance = await McpServerFactory.createAsync(
    server,
    oauthToken,
    server.apiKeyConfig || null
  );

  await serverInstance.initialize();
  const tools = await serverInstance.listTools();

  return tools.map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Merge remote tools with cached data and customizations
 */
function mergeToolsWithCustomizations(
  remoteTools: Array<{ name: string; description?: string; inputSchema?: unknown }>,
  cachedTools: Array<any>,
  customizations: Array<any>
) {
  return remoteTools.map((remoteTool) => {
    const custom = customizations.find((c) => c.toolName === remoteTool.name);
    const cachedTool = cachedTools.find((c) => c.toolName === remoteTool.name);

    const currentHash = CacheRepo.computeSchemaHash(remoteTool.inputSchema);
    const hasChanges = cachedTool ? currentHash !== cachedTool.schemaHash : false;

    return {
      name: remoteTool.name,
      original: {
        name: remoteTool.name,
        description: remoteTool.description,
        inputSchema: remoteTool.inputSchema,
      },
      customized: custom
        ? {
            name: custom.customName || remoteTool.name,
            description: custom.customDescription || remoteTool.description,
            inputSchema: custom.customInputSchema || remoteTool.inputSchema,
          }
        : null,
      isEnabled: custom ? !!custom.isEnabled : true,
      hasChanges,
      changeType: getChangeType(remoteTool, cachedTool),
    };
  });
}

/**
 * Get change type for a tool
 */
function getChangeType(
  remoteTool: { name: string; description?: string; inputSchema?: unknown },
  cachedTool: any
): 'added' | 'modified' | 'unchanged' | null {
  if (!cachedTool) return 'added';

  const currentHash = CacheRepo.computeSchemaHash(remoteTool.inputSchema);
  return currentHash !== cachedTool.schemaHash ? 'modified' : 'unchanged';
}

/**
 * Detect changes between remote and cached tools
 */
function detectChanges(
  remoteTools: Array<{ name: string; description?: string; inputSchema?: unknown }>,
  cachedTools: Array<any>
) {
  const remoteNames = new Set(remoteTools.map((t) => t.name));
  const cachedNames = new Set(cachedTools.map((t) => t.toolName));

  const added = remoteTools.filter((t) => !cachedNames.has(t.name));
  const removed = cachedTools.filter((t) => !remoteNames.has(t.toolName));
  const modified = remoteTools.filter((t) => {
    const cached = cachedTools.find((c) => c.toolName === t.name);
    if (!cached) return false;

    const currentHash = CacheRepo.computeSchemaHash(t.inputSchema);
    return currentHash !== cached.schemaHash;
  });

  return {
    added: added.map((t) => ({ name: t.name, description: t.description })),
    removed: removed.map((t) => ({ name: t.toolName, description: t.description })),
    modified: modified.map((t) => ({ name: t.name, description: t.description })),
  };
}
