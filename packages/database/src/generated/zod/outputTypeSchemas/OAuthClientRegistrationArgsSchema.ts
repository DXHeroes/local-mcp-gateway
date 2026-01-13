import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthClientRegistrationSelectSchema } from '../inputTypeSchemas/OAuthClientRegistrationSelectSchema';
import { OAuthClientRegistrationIncludeSchema } from '../inputTypeSchemas/OAuthClientRegistrationIncludeSchema';

export const OAuthClientRegistrationArgsSchema: z.ZodType<Prisma.OAuthClientRegistrationDefaultArgs> = z.object({
  select: z.lazy(() => OAuthClientRegistrationSelectSchema).optional(),
  include: z.lazy(() => OAuthClientRegistrationIncludeSchema).optional(),
}).strict();

export default OAuthClientRegistrationArgsSchema;
