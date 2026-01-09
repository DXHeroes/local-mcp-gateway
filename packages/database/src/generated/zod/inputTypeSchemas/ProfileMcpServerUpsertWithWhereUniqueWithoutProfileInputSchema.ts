import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithoutProfileInputSchema } from './ProfileMcpServerUpdateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema';
import { ProfileMcpServerCreateWithoutProfileInputSchema } from './ProfileMcpServerCreateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateWithoutProfileInputSchema';

export const ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutProfileInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema) ]),
});

export default ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema;
