import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereInputSchema'

export const ProfileMcpServerToolDeleteManyArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolDeleteManyArgs> = z.object({
  where: ProfileMcpServerToolWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileMcpServerToolDeleteManyArgsSchema;
