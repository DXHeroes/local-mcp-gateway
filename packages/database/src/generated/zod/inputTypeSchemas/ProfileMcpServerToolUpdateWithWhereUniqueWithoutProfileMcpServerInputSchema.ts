import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolWhereUniqueInputSchema } from './ProfileMcpServerToolWhereUniqueInputSchema';
import { ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema) ]),
});

export default ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema;
