import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolWhereInputSchema } from './ProfileMcpServerToolWhereInputSchema';

export const ProfileMcpServerToolListRelationFilterSchema: z.ZodType<Prisma.ProfileMcpServerToolListRelationFilter> = z.strictObject({
  every: z.lazy(() => ProfileMcpServerToolWhereInputSchema).optional(),
  some: z.lazy(() => ProfileMcpServerToolWhereInputSchema).optional(),
  none: z.lazy(() => ProfileMcpServerToolWhereInputSchema).optional(),
});

export default ProfileMcpServerToolListRelationFilterSchema;
