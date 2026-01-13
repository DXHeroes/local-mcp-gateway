import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'
import { OAuthClientRegistrationOrderByWithRelationInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationOrderByWithRelationInputSchema'
import { OAuthClientRegistrationWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereUniqueInputSchema'

export const OAuthClientRegistrationAggregateArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationAggregateArgs> = z.object({
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthClientRegistrationOrderByWithRelationInputSchema.array(), OAuthClientRegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: OAuthClientRegistrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default OAuthClientRegistrationAggregateArgsSchema;
