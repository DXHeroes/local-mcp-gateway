import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileCreateManyInputSchema } from '../inputTypeSchemas/ProfileCreateManyInputSchema'

export const ProfileCreateManyArgsSchema: z.ZodType<Prisma.ProfileCreateManyArgs> = z.object({
  data: z.union([ ProfileCreateManyInputSchema, ProfileCreateManyInputSchema.array() ]),
}).strict();

export default ProfileCreateManyArgsSchema;
