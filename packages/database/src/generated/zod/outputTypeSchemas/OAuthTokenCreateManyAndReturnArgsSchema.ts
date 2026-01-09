import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenCreateManyInputSchema } from '../inputTypeSchemas/OAuthTokenCreateManyInputSchema'

export const OAuthTokenCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OAuthTokenCreateManyAndReturnArgs> = z.object({
  data: z.union([ OAuthTokenCreateManyInputSchema, OAuthTokenCreateManyInputSchema.array() ]),
}).strict();

export default OAuthTokenCreateManyAndReturnArgsSchema;
