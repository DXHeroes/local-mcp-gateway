import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileScalarRelationFilterSchema } from './ProfileScalarRelationFilterSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { McpServerNullableScalarRelationFilterSchema } from './McpServerNullableScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const DebugLogWhereInputSchema: z.ZodType<Prisma.DebugLogWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DebugLogWhereInputSchema), z.lazy(() => DebugLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DebugLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DebugLogWhereInputSchema), z.lazy(() => DebugLogWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  profileId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  requestType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  requestPayload: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  responsePayload: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  errorMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  profile: z.union([ z.lazy(() => ProfileScalarRelationFilterSchema), z.lazy(() => ProfileWhereInputSchema) ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerNullableScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional().nullable(),
});

export default DebugLogWhereInputSchema;
