import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerCreateWithoutMcpServerInputSchema } from './ProfileMcpServerCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema';

export const ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateOrConnectWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema;
