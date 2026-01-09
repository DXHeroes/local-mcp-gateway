import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenWhereInputSchema } from '../inputTypeSchemas/OAuthTokenWhereInputSchema'
import { OAuthTokenOrderByWithAggregationInputSchema } from '../inputTypeSchemas/OAuthTokenOrderByWithAggregationInputSchema'
import { OAuthTokenScalarFieldEnumSchema } from '../inputTypeSchemas/OAuthTokenScalarFieldEnumSchema'
import { OAuthTokenScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/OAuthTokenScalarWhereWithAggregatesInputSchema'

export const OAuthTokenGroupByArgsSchema: z.ZodType<Prisma.OAuthTokenGroupByArgs> = z.object({
  where: OAuthTokenWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthTokenOrderByWithAggregationInputSchema.array(), OAuthTokenOrderByWithAggregationInputSchema ]).optional(),
  by: OAuthTokenScalarFieldEnumSchema.array(), 
  having: OAuthTokenScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default OAuthTokenGroupByArgsSchema;
