import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';

export const ProfileScalarRelationFilterSchema: z.ZodType<Prisma.ProfileScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProfileWhereInputSchema).optional(),
  isNot: z.lazy(() => ProfileWhereInputSchema).optional(),
});

export default ProfileScalarRelationFilterSchema;
