import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateNestedManyWithoutProfileInputSchema } from './DebugLogCreateNestedManyWithoutProfileInputSchema';

export const ProfileCreateWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileCreateWithoutMcpServersInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  debugLogs: z.lazy(() => DebugLogCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileCreateWithoutMcpServersInputSchema;
