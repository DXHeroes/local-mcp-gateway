import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateNestedOneWithoutMcpServersInputSchema } from './ProfileCreateNestedOneWithoutMcpServersInputSchema';
import { ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema';

export const ProfileMcpServerCreateWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateWithoutMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profile: z.lazy(() => ProfileCreateNestedOneWithoutMcpServersInputSchema),
  tools: z.lazy(() => ProfileMcpServerToolCreateNestedManyWithoutProfileMcpServerInputSchema).optional(),
});

export default ProfileMcpServerCreateWithoutMcpServerInputSchema;
