import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { UserCreateNestedOneWithoutProfilesInputSchema } from './UserCreateNestedOneWithoutProfilesInputSchema';
import { OrganizationCreateNestedOneWithoutProfilesInputSchema } from './OrganizationCreateNestedOneWithoutProfilesInputSchema';
import { ProfileMcpServerCreateNestedManyWithoutProfileInputSchema } from './ProfileMcpServerCreateNestedManyWithoutProfileInputSchema';
import { DebugLogCreateNestedManyWithoutProfileInputSchema } from './DebugLogCreateNestedManyWithoutProfileInputSchema';

export const ProfileCreateInputSchema: z.ZodType<Prisma.ProfileCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutProfilesInputSchema),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutProfilesInputSchema),
  mcpServers: z.lazy(() => ProfileMcpServerCreateNestedManyWithoutProfileInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileCreateInputSchema;
