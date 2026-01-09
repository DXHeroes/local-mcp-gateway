import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';

export const ProfileMcpServerListRelationFilterSchema: z.ZodType<Prisma.ProfileMcpServerListRelationFilter> = z.strictObject({
  every: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
  some: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
  none: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
});

export default ProfileMcpServerListRelationFilterSchema;
