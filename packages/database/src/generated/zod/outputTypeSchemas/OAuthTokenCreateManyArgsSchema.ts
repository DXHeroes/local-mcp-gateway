import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenCreateManyInputSchema } from '../inputTypeSchemas/OAuthTokenCreateManyInputSchema'

export const OAuthTokenCreateManyArgsSchema: z.ZodType<Prisma.OAuthTokenCreateManyArgs> = z.object({
  data: z.union([ OAuthTokenCreateManyInputSchema, OAuthTokenCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default OAuthTokenCreateManyArgsSchema;
