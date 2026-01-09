import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerCreateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerCreateManyInputSchema'

export const ProfileMcpServerCreateManyArgsSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyArgs> = z.object({
  data: z.union([ ProfileMcpServerCreateManyInputSchema, ProfileMcpServerCreateManyInputSchema.array() ]),
}).strict();

export default ProfileMcpServerCreateManyArgsSchema;
