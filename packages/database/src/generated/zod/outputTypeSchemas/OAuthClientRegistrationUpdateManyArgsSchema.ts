import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationUpdateManyMutationInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationUpdateManyMutationInputSchema'
import { OAuthClientRegistrationUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationUncheckedUpdateManyInputSchema'
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'

export const OAuthClientRegistrationUpdateManyArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationUpdateManyArgs> = z.object({
  data: z.union([ OAuthClientRegistrationUpdateManyMutationInputSchema, OAuthClientRegistrationUncheckedUpdateManyInputSchema ]),
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default OAuthClientRegistrationUpdateManyArgsSchema;
