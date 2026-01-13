import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereInputSchema'

export const ProfileMcpServerDeleteManyArgsSchema: z.ZodType<Prisma.ProfileMcpServerDeleteManyArgs> = z.object({
  where: ProfileMcpServerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileMcpServerDeleteManyArgsSchema;
