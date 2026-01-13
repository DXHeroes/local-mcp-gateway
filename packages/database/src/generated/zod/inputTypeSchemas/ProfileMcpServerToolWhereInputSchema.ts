import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileMcpServerScalarRelationFilterSchema } from './ProfileMcpServerScalarRelationFilterSchema';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';

export const ProfileMcpServerToolWhereInputSchema: z.ZodType<Prisma.ProfileMcpServerToolWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProfileMcpServerToolWhereInputSchema), z.lazy(() => ProfileMcpServerToolWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileMcpServerToolWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileMcpServerToolWhereInputSchema), z.lazy(() => ProfileMcpServerToolWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  profileMcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isEnabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  customName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  customDescription: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  customInputSchema: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  profileMcpServer: z.union([ z.lazy(() => ProfileMcpServerScalarRelationFilterSchema), z.lazy(() => ProfileMcpServerWhereInputSchema) ]).optional(),
});

export default ProfileMcpServerToolWhereInputSchema;
