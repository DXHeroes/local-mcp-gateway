import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateWithoutMcpServersInputSchema } from './ProfileCreateWithoutMcpServersInputSchema';
import { ProfileUncheckedCreateWithoutMcpServersInputSchema } from './ProfileUncheckedCreateWithoutMcpServersInputSchema';
import { ProfileCreateOrConnectWithoutMcpServersInputSchema } from './ProfileCreateOrConnectWithoutMcpServersInputSchema';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';

export const ProfileCreateNestedOneWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileCreateNestedOneWithoutMcpServersInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileCreateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutMcpServersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileCreateOrConnectWithoutMcpServersInputSchema).optional(),
  connect: z.lazy(() => ProfileWhereUniqueInputSchema).optional(),
});

export default ProfileCreateNestedOneWithoutMcpServersInputSchema;
