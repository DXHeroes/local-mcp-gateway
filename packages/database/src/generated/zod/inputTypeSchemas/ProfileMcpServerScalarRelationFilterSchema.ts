import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';

export const ProfileMcpServerScalarRelationFilterSchema: z.ZodType<Prisma.ProfileMcpServerScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
  isNot: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
});

export default ProfileMcpServerScalarRelationFilterSchema;
