import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerCreateWithoutProfileInputSchema } from './ProfileMcpServerCreateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateWithoutProfileInputSchema';

export const ProfileMcpServerCreateOrConnectWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateOrConnectWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema) ]),
});

export default ProfileMcpServerCreateOrConnectWithoutProfileInputSchema;
