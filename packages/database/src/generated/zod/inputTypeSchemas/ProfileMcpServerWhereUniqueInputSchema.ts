import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema } from './ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { BoolFilterSchema } from './BoolFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { ProfileScalarRelationFilterSchema } from './ProfileScalarRelationFilterSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { McpServerScalarRelationFilterSchema } from './McpServerScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { ProfileMcpServerToolListRelationFilterSchema } from './ProfileMcpServerToolListRelationFilterSchema';

export const ProfileMcpServerWhereUniqueInputSchema: z.ZodType<Prisma.ProfileMcpServerWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    profileId_mcpServerId: z.lazy(() => ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    profileId_mcpServerId: z.lazy(() => ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  profileId_mcpServerId: z.lazy(() => ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => ProfileMcpServerWhereInputSchema), z.lazy(() => ProfileMcpServerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileMcpServerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileMcpServerWhereInputSchema), z.lazy(() => ProfileMcpServerWhereInputSchema).array() ]).optional(),
  profileId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  profile: z.union([ z.lazy(() => ProfileScalarRelationFilterSchema), z.lazy(() => ProfileWhereInputSchema) ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional(),
  tools: z.lazy(() => ProfileMcpServerToolListRelationFilterSchema).optional(),
}));

export default ProfileMcpServerWhereUniqueInputSchema;
