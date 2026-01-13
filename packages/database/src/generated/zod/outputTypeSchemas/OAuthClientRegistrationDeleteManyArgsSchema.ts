import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationWhereInputSchema } from '../inputTypeSchemas/OAuthClientRegistrationWhereInputSchema'

export const OAuthClientRegistrationDeleteManyArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationDeleteManyArgs> = z.object({
  where: OAuthClientRegistrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default OAuthClientRegistrationDeleteManyArgsSchema;
