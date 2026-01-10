import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereInputSchema } from './DebugLogWhereInputSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileNullableScalarRelationFilterSchema } from './ProfileNullableScalarRelationFilterSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { McpServerNullableScalarRelationFilterSchema } from './McpServerNullableScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const DebugLogWhereUniqueInputSchema: z.ZodType<Prisma.DebugLogWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => DebugLogWhereInputSchema), z.lazy(() => DebugLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DebugLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DebugLogWhereInputSchema), z.lazy(() => DebugLogWhereInputSchema).array() ]).optional(),
  profileId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  mcpServerId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  requestType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  requestPayload: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  responsePayload: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  errorMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  profile: z.union([ z.lazy(() => ProfileNullableScalarRelationFilterSchema), z.lazy(() => ProfileWhereInputSchema) ]).optional().nullable(),
  mcpServer: z.union([ z.lazy(() => McpServerNullableScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional().nullable(),
}));

export default DebugLogWhereUniqueInputSchema;
