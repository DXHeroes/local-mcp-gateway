import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateWithoutMcpServersInputSchema } from './ProfileCreateWithoutMcpServersInputSchema';
import { ProfileUncheckedCreateWithoutMcpServersInputSchema } from './ProfileUncheckedCreateWithoutMcpServersInputSchema';
import { ProfileCreateOrConnectWithoutMcpServersInputSchema } from './ProfileCreateOrConnectWithoutMcpServersInputSchema';
import { ProfileUpsertWithoutMcpServersInputSchema } from './ProfileUpsertWithoutMcpServersInputSchema';
import { ProfileWhereUniqueInputSchema } from './ProfileWhereUniqueInputSchema';
import { ProfileUpdateToOneWithWhereWithoutMcpServersInputSchema } from './ProfileUpdateToOneWithWhereWithoutMcpServersInputSchema';
import { ProfileUpdateWithoutMcpServersInputSchema } from './ProfileUpdateWithoutMcpServersInputSchema';
import { ProfileUncheckedUpdateWithoutMcpServersInputSchema } from './ProfileUncheckedUpdateWithoutMcpServersInputSchema';

export const ProfileUpdateOneRequiredWithoutMcpServersNestedInputSchema: z.ZodType<Prisma.ProfileUpdateOneRequiredWithoutMcpServersNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileCreateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedCreateWithoutMcpServersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileCreateOrConnectWithoutMcpServersInputSchema).optional(),
  upsert: z.lazy(() => ProfileUpsertWithoutMcpServersInputSchema).optional(),
  connect: z.lazy(() => ProfileWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProfileUpdateToOneWithWhereWithoutMcpServersInputSchema), z.lazy(() => ProfileUpdateWithoutMcpServersInputSchema), z.lazy(() => ProfileUncheckedUpdateWithoutMcpServersInputSchema) ]).optional(),
});

export default ProfileUpdateOneRequiredWithoutMcpServersNestedInputSchema;
