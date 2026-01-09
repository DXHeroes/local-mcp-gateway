import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithoutMcpServerInputSchema } from './ProfileMcpServerUpdateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema';

export const ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutMcpServerInputSchema) ]),
});

export default ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema;
