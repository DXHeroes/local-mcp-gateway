import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { BoolWithAggregatesFilterSchema } from './BoolWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const ProfileMcpServerToolScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProfileMcpServerToolScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProfileMcpServerToolScalarWhereWithAggregatesInputSchema), z.lazy(() => ProfileMcpServerToolScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileMcpServerToolScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileMcpServerToolScalarWhereWithAggregatesInputSchema), z.lazy(() => ProfileMcpServerToolScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  profileMcpServerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isEnabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  customName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  customDescription: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  customInputSchema: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default ProfileMcpServerToolScalarWhereWithAggregatesInputSchema;
