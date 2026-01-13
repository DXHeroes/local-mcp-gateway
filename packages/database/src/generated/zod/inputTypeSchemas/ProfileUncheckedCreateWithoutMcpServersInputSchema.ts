import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema } from './DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema';

export const ProfileUncheckedCreateWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileUncheckedCreateWithoutMcpServersInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileUncheckedCreateWithoutMcpServersInputSchema;
