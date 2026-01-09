import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerUncheckedCreateWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUncheckedCreateWithoutProfileInput> = z.strictObject({
  id: z.uuid().optional(),
  mcpServerId: z.string(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  tools: z.lazy(() => ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInputSchema).optional(),
});

export default ProfileMcpServerUncheckedCreateWithoutProfileInputSchema;
