import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationCreateManyInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationCreateManyInputSchema'

export const OAuthClientRegistrationCreateManyArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateManyArgs> = z.object({
  data: z.union([ OAuthClientRegistrationCreateManyInputSchema, OAuthClientRegistrationCreateManyInputSchema.array() ]),
}).strict();

export default OAuthClientRegistrationCreateManyArgsSchema;
