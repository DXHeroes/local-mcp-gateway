import { z } from 'zod';

export const McpServerScalarFieldEnumSchema = z.enum(['id','name','type','config','oauthConfig','apiKeyConfig','createdAt','updatedAt']);

export default McpServerScalarFieldEnumSchema;
