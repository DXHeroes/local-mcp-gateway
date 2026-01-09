import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const ProfileMcpServerCreateManyProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyProfileInput> = z.strictObject({
  id: z.uuid().optional(),
  mcpServerId: z.string(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default ProfileMcpServerCreateManyProfileInputSchema;
