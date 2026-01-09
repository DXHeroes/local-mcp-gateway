import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema';
import { DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema } from './DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema';

export const ProfileUncheckedCreateInputSchema: z.ZodType<Prisma.ProfileUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  mcpServers: z.lazy(() => ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedCreateNestedManyWithoutProfileInputSchema).optional(),
});

export default ProfileUncheckedCreateInputSchema;
