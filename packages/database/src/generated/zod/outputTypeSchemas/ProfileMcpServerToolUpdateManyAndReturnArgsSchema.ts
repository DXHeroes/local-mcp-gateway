import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolUpdateManyMutationInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolUpdateManyMutationInputSchema'
import { ProfileMcpServerToolUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolUncheckedUpdateManyInputSchema'
import { ProfileMcpServerToolWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereInputSchema'

export const ProfileMcpServerToolUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileMcpServerToolUpdateManyMutationInputSchema, ProfileMcpServerToolUncheckedUpdateManyInputSchema ]),
  where: ProfileMcpServerToolWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileMcpServerToolUpdateManyAndReturnArgsSchema;
