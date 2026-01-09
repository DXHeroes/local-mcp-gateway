import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const ProfileMcpServerToolCreateManyInputSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  profileMcpServerId: z.string(),
  toolName: z.string(),
  isEnabled: z.boolean().optional(),
  customName: z.string().optional().nullable(),
  customDescription: z.string().optional().nullable(),
  customInputSchema: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default ProfileMcpServerToolCreateManyInputSchema;
