/**
 * SkipOrgCheck Decorator
 *
 * Marks a route or controller to skip the active organization check in AuthGuard.
 * Used for endpoints that don't need org context (e.g., org list, set active org).
 */

import { SetMetadata } from '@nestjs/common';

export const SKIP_ORG_CHECK_KEY = 'skipOrgCheck';
export const SkipOrgCheck = () => SetMetadata(SKIP_ORG_CHECK_KEY, true);
