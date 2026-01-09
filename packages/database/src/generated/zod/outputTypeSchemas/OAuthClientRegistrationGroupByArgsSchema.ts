import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'
import { OAuthClientRegistrationOrderByWithAggregationInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationOrderByWithAggregationInputSchema'
import { OAuthClientRegistrationScalarFieldEnumSchema } from '../inputTypeSchemas/OAuthClientRegistrationScalarFieldEnumSchema'
import { OAuthClientRegistrationScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationScalarWhereWithAggregatesInputSchema'

export const OAuthClientRegistrationGroupByArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationGroupByArgs> = z.object({
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthClientRegistrationOrderByWithAggregationInputSchema.array(), OAuthClientRegistrationOrderByWithAggregationInputSchema ]).optional(),
  by: OAuthClientRegistrationScalarFieldEnumSchema.array(), 
  having: OAuthClientRegistrationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default OAuthClientRegistrationGroupByArgsSchema;
