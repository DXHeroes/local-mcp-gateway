import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileUserIdOrganizationIdNameCompoundUniqueInputSchema } from './ProfileUserIdOrganizationIdNameCompoundUniqueInputSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { OrganizationScalarRelationFilterSchema } from './OrganizationScalarRelationFilterSchema';
import { OrganizationWhereInputSchema } from './OrganizationWhereInputSchema';
import { ProfileMcpServerListRelationFilterSchema } from './ProfileMcpServerListRelationFilterSchema';
import { DebugLogListRelationFilterSchema } from './DebugLogListRelationFilterSchema';

export const ProfileWhereUniqueInputSchema: z.ZodType<Prisma.ProfileWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    userId_organizationId_name: z.lazy(() => ProfileUserIdOrganizationIdNameCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    userId_organizationId_name: z.lazy(() => ProfileUserIdOrganizationIdNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  userId_organizationId_name: z.lazy(() => ProfileUserIdOrganizationIdNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileWhereInputSchema), z.lazy(() => ProfileWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  organization: z.union([ z.lazy(() => OrganizationScalarRelationFilterSchema), z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  mcpServers: z.lazy(() => ProfileMcpServerListRelationFilterSchema).optional(),
  debugLogs: z.lazy(() => DebugLogListRelationFilterSchema).optional(),
}));

export default ProfileWhereUniqueInputSchema;
