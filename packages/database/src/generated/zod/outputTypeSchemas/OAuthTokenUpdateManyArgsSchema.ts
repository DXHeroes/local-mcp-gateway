import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenUpdateManyMutationInputSchema } from '../inputTypeSchemas/OAuthTokenUpdateManyMutationInputSchema'
import { OAuthTokenUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/OAuthTokenUncheckedUpdateManyInputSchema'
import { OAuthTokenWhereInputSchema } from '../inputTypeSchemas/OAuthTokenWhereInputSchema'

export const OAuthTokenUpdateManyArgsSchema: z.ZodType<Prisma.OAuthTokenUpdateManyArgs> = z.object({
  data: z.union([ OAuthTokenUpdateManyMutationInputSchema, OAuthTokenUncheckedUpdateManyInputSchema ]),
  where: OAuthTokenWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default OAuthTokenUpdateManyArgsSchema;
