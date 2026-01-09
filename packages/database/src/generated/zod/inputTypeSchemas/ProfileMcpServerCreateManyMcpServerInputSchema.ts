import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const ProfileMcpServerCreateManyMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  profileId: z.string(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default ProfileMcpServerCreateManyMcpServerInputSchema;
