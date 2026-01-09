import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const ProfileMcpServerToolProfileMcpServerIdToolNameCompoundUniqueInputSchema: z.ZodType<Prisma.ProfileMcpServerToolProfileMcpServerIdToolNameCompoundUniqueInput> = z.strictObject({
  profileMcpServerId: z.string(),
  toolName: z.string(),
});

export default ProfileMcpServerToolProfileMcpServerIdToolNameCompoundUniqueInputSchema;
