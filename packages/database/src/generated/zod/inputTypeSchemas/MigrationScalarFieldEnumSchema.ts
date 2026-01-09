import { z } from 'zod';

export const MigrationScalarFieldEnumSchema = z.enum(['id','name','executedAt']);

export default MigrationScalarFieldEnumSchema;
