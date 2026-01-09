import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema';

export const ProfileUncheckedCreateWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileUncheckedCreateWithoutDebugLogsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  mcpServers: z.lazy(() => ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileUncheckedCreateWithoutDebugLogsInputSchema;
