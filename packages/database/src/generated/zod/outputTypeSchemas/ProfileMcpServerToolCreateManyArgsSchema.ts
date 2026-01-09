import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolCreateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolCreateManyInputSchema'

export const ProfileMcpServerToolCreateManyArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateManyArgs> = z.object({
  data: z.union([ ProfileMcpServerToolCreateManyInputSchema, ProfileMcpServerToolCreateManyInputSchema.array() ]),
}).strict();

export default ProfileMcpServerToolCreateManyArgsSchema;
