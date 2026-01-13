import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileUpdateWithoutDebugLogsInputSchema } from './ProfileUpdateWithoutDebugLogsInputSchema';
import { ProfileUncheckedUpdateWithoutDebugLogsInputSchema } from './ProfileUncheckedUpdateWithoutDebugLogsInputSchema';
import { ProfileCreateWithoutDebugLogsInputSchema } from './ProfileCreateWithoutDebugLogsInputSchema';
import { ProfileUncheckedCreateWithoutDebugLogsInputSchema } from './ProfileUncheckedCreateWithoutDebugLogsInputSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';

export const ProfileUpsertWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileUpsertWithoutDebugLogsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProfileUpdateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutDebugLogsInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileCreateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutDebugLogsInputSchema) ]),
  where: z.lazy(() => ProfileWhereInputSchema).optional(),
});

export default ProfileUpsertWithoutDebugLogsInputSchema;
