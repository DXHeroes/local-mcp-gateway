import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolCreateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolCreateManyInputSchema'

export const ProfileMcpServerToolCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileMcpServerToolCreateManyInputSchema, ProfileMcpServerToolCreateManyInputSchema.array() ]),
}).strict();

export default ProfileMcpServerToolCreateManyAndReturnArgsSchema;
