import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationCreateManyInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationCreateManyInputSchema'

export const OAuthClientRegistrationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateManyAndReturnArgs> = z.object({
  data: z.union([ OAuthClientRegistrationCreateManyInputSchema, OAuthClientRegistrationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default OAuthClientRegistrationCreateManyAndReturnArgsSchema;
