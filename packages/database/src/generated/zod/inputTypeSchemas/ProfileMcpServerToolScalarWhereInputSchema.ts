import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const ProfileMcpServerToolScalarWhereInputSchema: z.ZodType<Prisma.ProfileMcpServerToolScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema), z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema), z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  profileMcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isEnabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  customName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  customDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  customInputSchema: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default ProfileMcpServerToolScalarWhereInputSchema;
