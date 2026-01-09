import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileMcpServerListRelationFilterSchema } from './ProfileMcpServerListRelationFilterSchema';
import { DebugLogListRelationFilterSchema } from './DebugLogListRelationFilterSchema';

export const ProfileWhereInputSchema: z.ZodType<Prisma.ProfileWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServers: z.lazy(() => ProfileMcpServerListRelationFilterSchema).optional(),
  debugLogs: z.lazy(() => DebugLogListRelationFilterSchema).optional(),
});

export default ProfileWhereInputSchema;
