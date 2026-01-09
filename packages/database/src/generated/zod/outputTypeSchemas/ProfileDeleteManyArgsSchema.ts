import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileWhereInputSchema } from '../inputTypeSchemas/ProfileWhereInputSchema'

export const ProfileDeleteManyArgsSchema: z.ZodType<Prisma.ProfileDeleteManyArgs> = z.object({
  where: ProfileWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileDeleteManyArgsSchema;
