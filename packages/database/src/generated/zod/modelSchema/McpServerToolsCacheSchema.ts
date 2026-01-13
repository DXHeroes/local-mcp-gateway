import { z } from 'zod';
import { McpServerWithRelationsSchema, McpServerOptionalDefaultsWithRelationsSchema } from './McpServerSchema'
import type { McpServerWithRelations, McpServerOptionalDefaultsWithRelations } from './McpServerSchema'

/////////////////////////////////////////
// MCP SERVER TOOLS CACHE SCHEMA
/////////////////////////////////////////

/**
 * Cache for MCP server tool metadata (for change detection)
 */
export const McpServerToolsCacheSchema = z.object({
  id: z.uuid(),
  mcpServerId: z.string(),
  toolName: z.string(),
  description: z.string().nullable(),
  inputSchema: z.string().nullable(),
  schemaHash: z.string(),
  fetchedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type McpServerToolsCache = z.infer<typeof McpServerToolsCacheSchema>

/////////////////////////////////////////
// MCP SERVER TOOLS CACHE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const McpServerToolsCacheOptionalDefaultsSchema = McpServerToolsCacheSchema.merge(z.object({
  id: z.uuid().optional(),
  fetchedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type McpServerToolsCacheOptionalDefaults = z.infer<typeof McpServerToolsCacheOptionalDefaultsSchema>

/////////////////////////////////////////
// MCP SERVER TOOLS CACHE RELATION SCHEMA
/////////////////////////////////////////

export type McpServerToolsCacheRelations = {
  mcpServer: McpServerWithRelations;
};

export type McpServerToolsCacheWithRelations = z.infer<typeof McpServerToolsCacheSchema> & McpServerToolsCacheRelations

export const McpServerToolsCacheWithRelationsSchema: z.ZodType<McpServerToolsCacheWithRelations> = McpServerToolsCacheSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerWithRelationsSchema),
}))

/////////////////////////////////////////
// MCP SERVER TOOLS CACHE OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type McpServerToolsCacheOptionalDefaultsRelations = {
  mcpServer: McpServerOptionalDefaultsWithRelations;
};

export type McpServerToolsCacheOptionalDefaultsWithRelations = z.infer<typeof McpServerToolsCacheOptionalDefaultsSchema> & McpServerToolsCacheOptionalDefaultsRelations

export const McpServerToolsCacheOptionalDefaultsWithRelationsSchema: z.ZodType<McpServerToolsCacheOptionalDefaultsWithRelations> = McpServerToolsCacheOptionalDefaultsSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerOptionalDefaultsWithRelationsSchema),
}))

export default McpServerToolsCacheSchema;
