import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema: z.ZodType<Prisma.ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInput> = z.strictObject({
  profileId: z.string(),
  mcpServerId: z.string(),
});

export default ProfileMcpServerProfileIdMcpServerIdCompoundUniqueInputSchema;
