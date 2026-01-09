import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationUpdateManyMutationInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationUpdateManyMutationInputSchema'
import { OAuthClientRegistrationUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationUncheckedUpdateManyInputSchema'
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'

export const OAuthClientRegistrationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OAuthClientRegistrationUpdateManyMutationInputSchema, OAuthClientRegistrationUncheckedUpdateManyInputSchema ]),
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default OAuthClientRegistrationUpdateManyAndReturnArgsSchema;
