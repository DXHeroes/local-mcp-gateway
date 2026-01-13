import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateWithoutDebugLogsInputSchema } from './ProfileCreateWithoutDebugLogsInputSchema';
import { ProfileUncheckedCreateWithoutDebugLogsInputSchema } from './ProfileUncheckedCreateWithoutDebugLogsInputSchema';
import { ProfileCreateOrConnectWithoutDebugLogsInputSchema } from './ProfileCreateOrConnectWithoutDebugLogsInputSchema';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';

export const ProfileCreateNestedOneWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileCreateNestedOneWithoutDebugLogsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileCreateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutDebugLogsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileCreateOrConnectWithoutDebugLogsInputSchema).optional(),
  connect: z.lazy(() => ProfileWhereUniqueInputSchema).optional(),
});

export default ProfileCreateNestedOneWithoutDebugLogsInputSchema;
