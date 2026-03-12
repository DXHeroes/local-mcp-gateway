import type { ConfigService } from '@nestjs/config';

const DEFAULT_BACKEND_PORT = '3001';
const DEFAULT_FRONTEND_PORT = '3000';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function swapPort(origin: string, fromPort: string, toPort: string): string {
  const url = new URL(origin);
  if (url.port === fromPort) {
    url.port = toPort;
  }
  return trimTrailingSlash(url.origin);
}

export function resolvePublicBackendOrigin(configService: ConfigService): string {
  const configuredUrl = configService.get<string>('BETTER_AUTH_URL');
  if (configuredUrl) {
    return trimTrailingSlash(new URL(configuredUrl).origin);
  }

  const port = configService.get<number>('app.port') || Number(DEFAULT_BACKEND_PORT);
  return `http://localhost:${port}`;
}

export function resolvePublicAuthBaseUrl(configService: ConfigService): string {
  return `${resolvePublicBackendOrigin(configService)}/api/auth`;
}

export function resolveFrontendOrigin(configService: ConfigService): string {
  const configuredUrl = configService.get<string>('FRONTEND_URL');
  if (configuredUrl) {
    return trimTrailingSlash(new URL(configuredUrl).origin);
  }

  const backendOrigin = resolvePublicBackendOrigin(configService);
  const backendUrl = new URL(backendOrigin);

  if (backendUrl.port === '9631') {
    return swapPort(backendOrigin, '9631', '9630');
  }

  if (backendUrl.port === DEFAULT_BACKEND_PORT) {
    return swapPort(backendOrigin, DEFAULT_BACKEND_PORT, DEFAULT_FRONTEND_PORT);
  }

  return trimTrailingSlash(backendUrl.origin);
}

export function resolveMcpLoginPageUrl(configService: ConfigService): string {
  return `${resolveFrontendOrigin(configService)}/sign-in`;
}

export function createMcpProtectedResourceMetadata(configService: ConfigService) {
  const backendOrigin = resolvePublicBackendOrigin(configService);
  const authBaseUrl = resolvePublicAuthBaseUrl(configService);

  return {
    resource: `${backendOrigin}/api/mcp`,
    authorization_servers: [backendOrigin],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    jwks_uri: `${authBaseUrl}/mcp/jwks`,
    resource_signing_alg_values_supported: ['RS256', 'none'],
  };
}

export function createMcpWwwAuthenticateHeader(configService: ConfigService): string {
  const resourceMetadataUrl = `${resolvePublicBackendOrigin(
    configService
  )}/.well-known/oauth-protected-resource`;

  return [
    'Bearer',
    `resource_metadata="${resourceMetadataUrl}"`,
    `resource_metadata_uri="${resourceMetadataUrl}"`,
  ].join(' ');
}
