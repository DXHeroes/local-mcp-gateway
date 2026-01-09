import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateNestedManyWithoutProfileInputSchema } from './ProfileMcpServerCreateNestedManyWithoutProfileInputSchema';

export const ProfileCreateWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileCreateWithoutDebugLogsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  mcpServers: z.lazy(() => ProfileMcpServerCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileCreateWithoutDebugLogsInputSchema;
