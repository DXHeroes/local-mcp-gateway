/**
 * Core package exports
 */

export type { ApiKeyRepository } from './abstractions/ApiKeyManager.js';
export {
  ApiKeyManager,
  McpServer,
  McpServerFactory,
  OAuthDiscoveryService,
  OAuthManager,
  ProfileManager,
  ProxyHandler,
} from './abstractions/index.js';
export type {
  OAuthClientRegistrationRepository,
  OAuthTokenRepository,
} from './abstractions/OAuthManager.js';
export type {
  ProfileCreateInput,
  ProfileRepository,
  ProfileUpdateInput,
} from './abstractions/ProfileManager.js';
export type { LicensePayload, LicenseValidationResult } from './services/LicenseKeyService.js';

// Services
export { LicenseKeyService } from './services/LicenseKeyService.js';
export * from './types/index.js';
