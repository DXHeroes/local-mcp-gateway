import { z } from 'zod';

export const ProfileScalarFieldEnumSchema = z.enum(['id','name','description','userId','organizationId','createdAt','updatedAt']);

export default ProfileScalarFieldEnumSchema;
