/**
 * Public Decorator
 *
 * Marks a route or controller as public, bypassing the global AuthGuard.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
