import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolWhereUniqueInputSchema } from './ProfileMcpServerToolWhereUniqueInputSchema';
import { ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProfileMcpServerToolUpdateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedUpdateWithoutProfileMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema) ]),
});

export default ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema;
