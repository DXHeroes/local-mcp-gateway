import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithoutProfileInputSchema } from './ProfileMcpServerUpdateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema';

export const ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema) ]),
});

export default ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema;
