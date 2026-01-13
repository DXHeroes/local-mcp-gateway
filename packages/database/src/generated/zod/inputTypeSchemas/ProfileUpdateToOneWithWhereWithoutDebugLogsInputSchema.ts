import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { ProfileUpdateWithoutDebugLogsInputSchema } from './ProfileUpdateWithoutDebugLogsInputSchema';
import { ProfileUncheckedUpdateWithoutDebugLogsInputSchema } from './ProfileUncheckedUpdateWithoutDebugLogsInputSchema';

export const ProfileUpdateToOneWithWhereWithoutDebugLogsInputSchema: z.ZodType<Prisma.ProfileUpdateToOneWithWhereWithoutDebugLogsInput> = z.strictObject({
  where: z.lazy(() => ProfileWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProfileUpdateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutDebugLogsInputSchema) ]),
});

export default ProfileUpdateToOneWithWhereWithoutDebugLogsInputSchema;
