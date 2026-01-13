import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';
import { ProfileCreateWithoutDebugLogsInputSchema } from './ProfileCreateWithoutDebugLogsInputSchema';
import { ProfileUncheckedCreateWithoutDebugLogsInputSchema } from './ProfileUncheckedCreateWithoutDebugLogsInputSchema';

export const ProfileCreateOrConnectWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileCreateOrConnectWithoutDebugLogsInput> = z.strictObject({
  where: z.lazy(() => ProfileWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileCreateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutDebugLogsInputSchema) ]),
});

export default ProfileCreateOrConnectWithoutDebugLogsInputSchema;
