import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileUpdateManyMutationInputSchema } from '../inputTypeSchemas/ProfileUpdateManyMutationInputSchema'
import { ProfileUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/ProfileUncheckedUpdateManyInputSchema'
import { ProfileWhereInputSchema } from '../inputTypeSchemas/ProfileWhereInputSchema'

export const ProfileUpdateManyArgsSchema: z.ZodType<Prisma.ProfileUpdateManyArgs> = z.object({
  data: z.union([ ProfileUpdateManyMutationInputSchema, ProfileUncheckedUpdateManyInputSchema ]),
  where: ProfileWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileUpdateManyArgsSchema;
