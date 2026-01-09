import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationIncludeSchema } from '../inputTypeSchemas/OAuthClientRegistrationIncludeSchema'
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'
import { OAuthClientRegistrationOrderByWithRelationInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationOrderByWithRelationInputSchema'
import { OAuthClientRegistrationWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereUniqueInputSchema'
import { OAuthClientRegistrationScalarFieldEnumSchema } from '../inputTypeSchemas/OAuthClientRegistrationScalarFieldEnumSchema'
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

export const OAuthClientRegistrationFindFirstArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationFindFirstArgs> = z.object({
  select: OAuthClientRegistrationSelectSchema.optional(),
  include: z.lazy(() => OAuthClientRegistrationIncludeSchema).optional(),
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthClientRegistrationOrderByWithRelationInputSchema.array(), OAuthClientRegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: OAuthClientRegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OAuthClientRegistrationScalarFieldEnumSchema, OAuthClientRegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default OAuthClientRegistrationFindFirstArgsSchema;
