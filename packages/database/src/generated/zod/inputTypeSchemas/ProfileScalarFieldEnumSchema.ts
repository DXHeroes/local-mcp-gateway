import { z } from 'zod';

export const ProfileScalarFieldEnumSchema = z.enum(['id','name','description','createdAt','updatedAt']);

export default ProfileScalarFieldEnumSchema;
