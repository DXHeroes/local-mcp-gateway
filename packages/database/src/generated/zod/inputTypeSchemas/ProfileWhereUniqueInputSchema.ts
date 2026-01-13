import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileMcpServerListRelationFilterSchema } from './ProfileMcpServerListRelationFilterSchema';
import { DebugLogListRelationFilterSchema } from './DebugLogListRelationFilterSchema';

export const ProfileWhereUniqueInputSchema: z.ZodType<Prisma.ProfileWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    name: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServers: z.lazy(() => ProfileMcpServerListRelationFilterSchema).optional(),
  debugLogs: z.lazy(() => DebugLogListRelationFilterSchema).optional(),
}));

export default ProfileWhereUniqueInputSchema;
