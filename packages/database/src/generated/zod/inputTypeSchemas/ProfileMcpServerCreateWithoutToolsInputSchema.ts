import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateNestedOneWithoutMcpServersInputSchema } from './ProfileCreateNestedOneWithoutMcpServersInputSchema';
import { McpServerCreateNestedOneWithoutProfilesInputSchema } from './McpServerCreateNestedOneWithoutProfilesInputSchema';

export const ProfileMcpServerCreateWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateWithoutToolsInput> = z.strictObject({
  id: z.uuid().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profile: z.lazy(() => ProfileCreateNestedOneWithoutMcpServersInputSchema),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutProfilesInputSchema),
});

export default ProfileMcpServerCreateWithoutToolsInputSchema;
