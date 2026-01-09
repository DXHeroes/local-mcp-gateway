import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileUpdateWithoutMcpServersInputSchema } from './ProfileUpdateWithoutMcpServersInputSchema';
import { ProfileUncheckedUpdateWithoutMcpServersInputSchema } from './ProfileUncheckedUpdateWithoutMcpServersInputSchema';
import { ProfileCreateWithoutMcpServersInputSchema } from './ProfileCreateWithoutMcpServersInputSchema';
import { ProfileUncheckedCreateWithoutMcpServersInputSchema } from './ProfileUncheckedCreateWithoutMcpServersInputSchema';
import { ProfileWhereInputSchema } from './ProfileWhereInputSchema';

export const ProfileUpsertWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileUpsertWithoutMcpServersInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProfileUpdateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutMcpServersInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileCreateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutMcpServersInputSchema) ]),
  where: z.lazy(() => ProfileWhereInputSchema).optional(),
});

export default ProfileUpsertWithoutMcpServersInputSchema;
