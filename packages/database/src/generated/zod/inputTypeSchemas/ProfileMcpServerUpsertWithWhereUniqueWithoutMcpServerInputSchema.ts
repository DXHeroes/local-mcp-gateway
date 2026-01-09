import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithoutMcpServerInputSchema } from './ProfileMcpServerUpdateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema';
import { ProfileMcpServerCreateWithoutMcpServerInputSchema } from './ProfileMcpServerCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema';

export const ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema;
