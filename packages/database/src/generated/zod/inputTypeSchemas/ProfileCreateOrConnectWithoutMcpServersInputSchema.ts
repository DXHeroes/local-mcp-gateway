import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';
import { ProfileCreateWithoutMcpServersInputSchema } from './ProfileCreateWithoutMcpServersInputSchema';
import { ProfileUncheckedCreateWithoutMcpServersInputSchema } from './ProfileUncheckedCreateWithoutMcpServersInputSchema';

export const ProfileCreateOrConnectWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileCreateOrConnectWithoutMcpServersInput> = z.strictObject({
  where: z.lazy(() => ProfileWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileCreateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutMcpServersInputSchema) ]),
});

export default ProfileCreateOrConnectWithoutMcpServersInputSchema;
