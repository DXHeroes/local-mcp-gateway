import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateNestedOneWithoutMcpServersInputSchema } from './ProfileCreateNestedOneWithoutMcpServersInputSchema';
import { McpServerCreateNestedOneWithoutProfilesInputSchema } from './McpServerCreateNestedOneWithoutProfilesInputSchema';
import { ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerCreateInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profile: z.lazy(() => ProfileCreateNestedOneWithoutMcpServersInputSchema),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutProfilesInputSchema),
  tools: z.lazy(() => ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema).optional(),
});

export default ProfileMcpServerCreateInputSchema;
