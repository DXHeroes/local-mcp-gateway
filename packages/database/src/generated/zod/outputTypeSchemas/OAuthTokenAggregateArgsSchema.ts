import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenWhereInputSchema } from '../inputTypeSchemas/OAuthTokenWhereInputSchema'
import { OAuthTokenOrderByWithRelationInputSchema } from '../inputTypeSchemas/OAuthTokenOrderByWithRelationInputSchema'
import { OAuthTokenWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthTokenWhereUniqueInputSchema'

export const OAuthTokenAggregateArgsSchema: z.ZodType<Prisma.OAuthTokenAggregateArgs> = z.object({
  where: OAuthTokenWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthTokenOrderByWithRelationInputSchema.array(), OAuthTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: OAuthTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default OAuthTokenAggregateArgsSchema;
