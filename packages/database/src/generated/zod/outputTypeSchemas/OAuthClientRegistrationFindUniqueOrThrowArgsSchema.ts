import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationIncludeSchema } from '../inputTypeSchemas/OAuthClientRegistrationIncludeSchema'
import { OAuthClientRegistrationWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereUniqueInputSchema'
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const OAuthClientRegistrationSelectSchema: z.ZodType<Prisma.OAuthClientRegistrationSelect> = z.object({
  id: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  authorizationServerUrl: z.boolean().optional(),
  clientId: z.boolean().optional(),
  clientSecret: z.boolean().optional(),
  registrationAccessToken: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict()

export const OAuthClientRegistrationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationFindUniqueOrThrowArgs> = z.object({
  select: OAuthClientRegistrationSelectSchema.optional(),
  include: z.lazy(() => OAuthClientRegistrationIncludeSchema).optional(),
  where: OAuthClientRegistrationWhereUniqueInputSchema, 
}).strict();

export default OAuthClientRegistrationFindUniqueOrThrowArgsSchema;
