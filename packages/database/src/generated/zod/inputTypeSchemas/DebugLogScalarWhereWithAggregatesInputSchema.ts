import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { IntNullableWithAggregatesFilterSchema } from './IntNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const DebugLogScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DebugLogScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DebugLogScalarWhereWithAggregatesInputSchema), z.lazy(() => DebugLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DebugLogScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DebugLogScalarWhereWithAggregatesInputSchema), z.lazy(() => DebugLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  profileId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  mcpServerId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  requestType: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  requestPayload: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  responsePayload: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  errorMessage: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default DebugLogScalarWhereWithAggregatesInputSchema;
