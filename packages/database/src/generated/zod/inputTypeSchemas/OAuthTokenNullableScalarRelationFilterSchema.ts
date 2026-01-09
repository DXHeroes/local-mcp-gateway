import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';

export const OAuthTokenNullableScalarRelationFilterSchema: z.ZodType<Prisma.OAuthTokenNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => OAuthTokenWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => OAuthTokenWhereInputSchema).optional().nullable(),
});

export default OAuthTokenNullableScalarRelationFilterSchema;
