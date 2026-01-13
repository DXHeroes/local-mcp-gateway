import { z } from 'zod';

export const McpServerToolsCacheScalarFieldEnumSchema = z.enum(['id','mcpServerId','toolName','description','inputSchema','schemaHash','fetchedAt','createdAt']);

export default McpServerToolsCacheScalarFieldEnumSchema;
