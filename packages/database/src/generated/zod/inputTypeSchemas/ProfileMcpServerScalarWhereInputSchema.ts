import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const ProfileMcpServerScalarWhereInputSchema: z.ZodType<Prisma.ProfileMcpServerScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProfileMcpServerScalarWhereInputSchema), z.lazy(() => ProfileMcpServerScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileMcpServerScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileMcpServerScalarWhereInputSchema), z.lazy(() => ProfileMcpServerScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  profileId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default ProfileMcpServerScalarWhereInputSchema;
