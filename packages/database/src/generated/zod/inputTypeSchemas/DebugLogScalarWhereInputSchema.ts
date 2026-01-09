import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const DebugLogScalarWhereInputSchema: z.ZodType<Prisma.DebugLogScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => DebugLogScalarWhereInputSchema), z.lazy(() => DebugLogScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DebugLogScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DebugLogScalarWhereInputSchema), z.lazy(() => DebugLogScalarWhereInputSchema).array() ]).optional(),
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
});

export default DebugLogScalarWhereInputSchema;
