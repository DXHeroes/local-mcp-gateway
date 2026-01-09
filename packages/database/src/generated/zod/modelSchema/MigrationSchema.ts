import { z } from 'zod';

/////////////////////////////////////////
// MIGRATION SCHEMA
/////////////////////////////////////////

/**
 * Tracks applied database migrations
 */
export const MigrationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  executedAt: z.coerce.date(),
})

export type Migration = z.infer<typeof MigrationSchema>

/////////////////////////////////////////
// MIGRATION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MigrationOptionalDefaultsSchema = MigrationSchema.merge(z.object({
  id: z.uuid().optional(),
  executedAt: z.coerce.date().optional(),
}))

export type MigrationOptionalDefaults = z.infer<typeof MigrationOptionalDefaultsSchema>

export default MigrationSchema;
