import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';

export const ProfileNullableScalarRelationFilterSchema: z.ZodType<Prisma.ProfileNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProfileWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => ProfileWhereInputSchema).optional().nullable(),
});

export default ProfileNullableScalarRelationFilterSchema;
