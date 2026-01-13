import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolWhereUniqueInputSchema } from './ProfileMcpServerToolWhereUniqueInputSchema';
import { ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema) ]),
});

export default ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema;
