import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerScalarWhereInputSchema } from './ProfileMcpServerScalarWhereInputSchema';
import { ProfileMcpServerUpdateManyMutationInputSchema } from './ProfileMcpServerUpdateManyMutationInputSchema';
import { ProfileMcpServerUncheckedUpdateManyWithoutProfileInputSchema } from './ProfileMcpServerUncheckedUpdateManyWithoutProfileInputSchema';

export const ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateManyWithWhereWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProfileMcpServerUpdateManyMutationInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateManyWithoutProfileInputSchema) ]),
});

export default ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema;
