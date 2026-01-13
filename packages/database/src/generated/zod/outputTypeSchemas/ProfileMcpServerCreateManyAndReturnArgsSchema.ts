import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerCreateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerCreateManyInputSchema'

export const ProfileMcpServerCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileMcpServerCreateManyInputSchema, ProfileMcpServerCreateManyInputSchema.array() ]),
}).strict();

export default ProfileMcpServerCreateManyAndReturnArgsSchema;
