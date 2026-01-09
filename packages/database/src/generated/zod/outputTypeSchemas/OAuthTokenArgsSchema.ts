import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenSelectSchema } from '../inputTypeSchemas/OAuthTokenSelectSchema';
import { OAuthTokenIncludeSchema } from '../inputTypeSchemas/OAuthTokenIncludeSchema';

export const OAuthTokenArgsSchema: z.ZodType<Prisma.OAuthTokenDefaultArgs> = z.object({
  select: z.lazy(() => OAuthTokenSelectSchema).optional(),
  include: z.lazy(() => OAuthTokenIncludeSchema).optional(),
}).strict();

export default OAuthTokenArgsSchema;
