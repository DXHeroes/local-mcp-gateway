import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateWithoutDebugLogsInputSchema } from './ProfileCreateWithoutDebugLogsInputSchema';
import { ProfileUncheckedCreateWithoutDebugLogsInputSchema } from './ProfileUncheckedCreateWithoutDebugLogsInputSchema';
import { ProfileCreateOrConnectWithoutDebugLogsInputSchema } from './ProfileCreateOrConnectWithoutDebugLogsInputSchema';
import { ProfileUpsertWithoutDebugLogsInputSchema } from './ProfileUpsertWithoutDebugLogsInputSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';
import { ProfileUpdateToOneWithWhereWithoutDebugLogsInputSchema } from './ProfileUpdateToOneWithWhereWithoutDebugLogsInputSchema';
import { ProfileUpdateWithoutDebugLogsInputSchema } from './ProfileUpdateWithoutDebugLogsInputSchema';
import { ProfileUncheckedUpdateWithoutDebugLogsInputSchema } from './ProfileUncheckedUpdateWithoutDebugLogsInputSchema';

export const ProfileUpdateOneWithoutDebugLogsNestedInputSchema: z.ZodType<Prisma.ProfileUpdateOneWithoutDebugLogsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileCreateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutDebugLogsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileCreateOrConnectWithoutDebugLogsInputSchema).optional(),
  upsert: z.lazy(() => ProfileUpsertWithoutDebugLogsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProfileWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProfileWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProfileWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProfileUpdateToOneWithWhereWithoutDebugLogsInputSchema), z.lazy(() => ProfileUpdateWithoutDebugLogsInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutDebugLogsInputSchema) ]).optional(),
});

export default ProfileUpdateOneWithoutDebugLogsNestedInputSchema;
