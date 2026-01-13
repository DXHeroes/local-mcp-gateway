import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerScalarWhereInputSchema } from './ProfileMcpServerScalarWhereInputSchema';
import { ProfileMcpServerUpdateManyMutationInputSchema } from './ProfileMcpServerUpdateManyMutationInputSchema';
import { ProfileMcpServerUncheckedUpdateManyWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedUpdateManyWithoutMcpServerInputSchema';

export const ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerUpdateManyMutationInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateManyWithoutMcpServerInputSchema) ]),
});

export default ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema;
