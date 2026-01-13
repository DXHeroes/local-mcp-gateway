import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const OAuthClientRegistrationIncludeSchema: z.ZodType<Prisma.OAuthClientRegistrationInclude> = z.object({
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict();

export default OAuthClientRegistrationIncludeSchema;
