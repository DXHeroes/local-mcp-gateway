import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateNestedOneWithoutToolsInputSchema } from './ProfileMcpServerCreateNestedOneWithoutToolsInputSchema';

export const ProfileMcpServerToolCreateInputSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  toolName: z.string(),
  isEnabled: z.boolean().optional(),
  customName: z.string().optional().nullable(),
  customDescription: z.string().optional().nullable(),
  customInputSchema: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profileMcpServer: z.lazy(() => ProfileMcpServerCreateNestedOneWithoutToolsInputSchema),
});

export default ProfileMcpServerToolCreateInputSchema;
