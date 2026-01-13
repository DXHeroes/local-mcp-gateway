import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolScalarWhereInputSchema } from './ProfileMcpServerToolScalarWhereInputSchema';
import { ProfileMcpServerToolUpdateManyMutationInputSchema } from './ProfileMcpServerToolUpdateManyMutationInputSchema';
import { ProfileMcpServerToolUncheckedUpdateManyWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedUpdateManyWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerToolUpdateManyMutationInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedUpdateManyWithoutProfileMcpServerInputSchema) ]),
});

export default ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema;
