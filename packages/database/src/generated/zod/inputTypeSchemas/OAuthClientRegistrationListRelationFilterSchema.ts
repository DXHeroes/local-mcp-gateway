import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationWhereInputSchema } from './OAuthClientRegistrationWhereInputSchema';

export const OAuthClientRegistrationListRelationFilterSchema: z.ZodType<Prisma.OAuthClientRegistrationListRelationFilter> = z.strictObject({
  every: z.lazy(() => OAuthClientRegistrationWhereInputSchema).optional(),
  some: z.lazy(() => OAuthClientRegistrationWhereInputSchema).optional(),
  none: z.lazy(() => OAuthClientRegistrationWhereInputSchema).optional(),
});

export default OAuthClientRegistrationListRelationFilterSchema;
