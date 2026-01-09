import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';
import { ProfileUpdateWithoutMcpServersInputSchema } from './ProfileUpdateWithoutMcpServersInputSchema';
import { ProfileUncheckedUpdateWithoutMcpServersInputSchema } from './ProfileUncheckedUpdateWithoutMcpServersInputSchema';

export const ProfileUpdateToOneWithWhereWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileUpdateToOneWithWhereWithoutMcpServersInput> = z.strictObject({
  where: z.lazy(() => ProfileWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProfileUpdateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutMcpServersInputSchema) ]),
});

export default ProfileUpdateToOneWithWhereWithoutMcpServersInputSchema;
