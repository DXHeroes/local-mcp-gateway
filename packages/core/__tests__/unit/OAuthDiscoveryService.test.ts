import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthDiscoveryService } from '../../src/abstractions/OAuthDiscoveryService.js';

// Helper to create a mock fetch response
function mockResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body ?? ''),
    headers: new Headers(),
  } as Response;
}

// Standard test fixtures
const RESOURCE_METADATA = {
  authorization_servers: ['https://auth.example.com'],
  resource: 'https://mcp.example.com/mcp',
};

const AUTH_SERVER_METADATA = {
  authorization_endpoint: 'https://auth.example.com/authorize',
  token_endpoint: 'https://auth.example.com/token',
  registration_endpoint: 'https://auth.example.com/register',
  scopes_supported: ['read', 'write'],
};

describe('OAuthDiscoveryService', () => {
  let service: OAuthDiscoveryService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new OAuthDiscoveryService();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('discoverFromServerUrl', () => {
    // Helper that sets up fetch to respond to auth server metadata discovery
    // after the resource metadata is found
    function setupAuthServerMetadataResponse() {
      // Auth server metadata will be fetched after resource metadata is discovered.
      // We match on the URL containing 'oauth-authorization-server' or 'openid-configuration'.
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('oauth-protected-resource')) {
          // Will be overridden by individual tests
          return mockResponse(404);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });
    }

    it('should try path-based well-known URL first for /mcp path (Sentry fix)', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://mcp.sentry.dev/.well-known/oauth-protected-resource/mcp') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://mcp.sentry.dev/mcp');

      // Verify the path-based URL was tried first
      expect(fetchMock).toHaveBeenCalledWith(
        'https://mcp.sentry.dev/.well-known/oauth-protected-resource/mcp'
      );
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
      expect(result.authorizationEndpoint).toBe('https://auth.example.com/authorize');
      expect(result.tokenEndpoint).toBe('https://auth.example.com/token');
    });

    it('should try path-based well-known URL first for /sse path', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource/sse') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://example.com/sse');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/.well-known/oauth-protected-resource/sse'
      );
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });

    it('should try path-based well-known URL for custom paths like /public/mcp', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource/public/mcp') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://example.com/public/mcp');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/.well-known/oauth-protected-resource/public/mcp'
      );
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });

    it('should fallback to root well-known URL when path-based returns 404', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://mcp.sentry.dev/.well-known/oauth-protected-resource/mcp') {
          return mockResponse(404);
        }
        if (url === 'https://mcp.sentry.dev/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://mcp.sentry.dev/mcp');

      // Path-based should be tried first
      expect(fetchMock).toHaveBeenCalledWith(
        'https://mcp.sentry.dev/.well-known/oauth-protected-resource/mcp'
      );
      // Then root fallback
      expect(fetchMock).toHaveBeenCalledWith(
        'https://mcp.sentry.dev/.well-known/oauth-protected-resource'
      );
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });

    it('should skip path-based URL for root path /', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://example.com/');

      // Should only try the root well-known URL, not a path-based one
      const resourceMetadataCalls = fetchMock.mock.calls.filter((call: [string]) =>
        call[0].includes('oauth-protected-resource')
      );
      expect(resourceMetadataCalls).toHaveLength(1);
      expect(resourceMetadataCalls[0][0]).toBe(
        'https://example.com/.well-known/oauth-protected-resource'
      );
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });

    it('should throw when no well-known URLs return valid metadata', async () => {
      fetchMock.mockResolvedValue(mockResponse(404));

      await expect(
        service.discoverFromServerUrl('https://example.com/mcp')
      ).rejects.toThrow('Failed to discover Protected Resource Metadata');
    });

    it('should handle fetch errors gracefully and continue trying other URLs', async () => {
      let callCount = 0;
      fetchMock.mockImplementation(async (url: string) => {
        callCount++;
        if (url.includes('oauth-protected-resource/mcp')) {
          throw new Error('Network error');
        }
        if (url === 'https://example.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://example.com/mcp');

      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });

    it('should correctly parse URL without trailing slash', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://example.com');

      // URL constructor normalizes 'https://example.com' to pathname '/'
      const resourceMetadataCalls = fetchMock.mock.calls.filter((call: [string]) =>
        call[0].includes('oauth-protected-resource')
      );
      expect(resourceMetadataCalls).toHaveLength(1);
      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
    });
  });

  describe('registerClient', () => {
    it('should include client_name "Local MCP Gateway" in registration request (Attio fix)', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, {
          client_id: 'new-client-id',
        })
      );

      await service.registerClient('https://auth.example.com/register', 'http://localhost:3001/callback', ['read', 'write']);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.client_name).toBe('Local MCP Gateway');
    });

    it('should include all required fields in registration request', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, {
          client_id: 'new-client-id',
        })
      );

      await service.registerClient(
        'https://auth.example.com/register',
        'http://localhost:3001/callback',
        ['read', 'write']
      );

      const [url, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toBe('https://auth.example.com/register');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers.Accept).toBe('application/json');

      expect(body).toEqual({
        client_name: 'Local MCP Gateway',
        redirect_uris: ['http://localhost:3001/callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: 'read write',
        token_endpoint_auth_method: 'none',
      });
    });

    it('should return clientId from registration response', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, {
          client_id: 'my-client-id',
          client_secret: 'my-secret',
          registration_access_token: 'my-token',
        })
      );

      const result = await service.registerClient(
        'https://auth.example.com/register',
        'http://localhost:3001/callback',
        ['read']
      );

      expect(result.clientId).toBe('my-client-id');
      expect(result.clientSecret).toBe('my-secret');
      expect(result.registrationAccessToken).toBe('my-token');
    });

    it('should return clientId without optional fields', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, {
          client_id: 'my-client-id',
        })
      );

      const result = await service.registerClient(
        'https://auth.example.com/register',
        'http://localhost:3001/callback',
        ['read']
      );

      expect(result.clientId).toBe('my-client-id');
      expect(result.clientSecret).toBeUndefined();
      expect(result.registrationAccessToken).toBeUndefined();
    });

    it('should throw on registration failure', async () => {
      fetchMock.mockResolvedValue(mockResponse(400, { error: 'invalid_client_metadata' }));

      await expect(
        service.registerClient(
          'https://auth.example.com/register',
          'http://localhost:3001/callback',
          ['read']
        )
      ).rejects.toThrow('Client registration failed: 400');
    });

    it('should join scopes with space separator', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, { client_id: 'id' })
      );

      await service.registerClient(
        'https://auth.example.com/register',
        'http://localhost:3001/callback',
        ['read', 'write', 'admin']
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.scope).toBe('read write admin');
    });
  });

  describe('discoverFromResourceMetadata', () => {
    it('should fetch and process resource metadata from given URL', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, AUTH_SERVER_METADATA);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromResourceMetadata(
        'https://example.com/.well-known/oauth-protected-resource'
      );

      expect(result.authorizationServerUrl).toBe('https://auth.example.com');
      expect(result.authorizationEndpoint).toBe('https://auth.example.com/authorize');
      expect(result.tokenEndpoint).toBe('https://auth.example.com/token');
      expect(result.registrationEndpoint).toBe('https://auth.example.com/register');
      expect(result.scopes).toEqual(['read', 'write']);
      expect(result.resource).toBe('https://mcp.example.com/mcp');
    });

    it('should throw when resource metadata fetch fails', async () => {
      fetchMock.mockResolvedValue(mockResponse(404));

      await expect(
        service.discoverFromResourceMetadata(
          'https://example.com/.well-known/oauth-protected-resource'
        )
      ).rejects.toThrow('Failed to fetch resource metadata: 404');
    });

    it('should throw when resource metadata has no authorization servers', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(200, {
          authorization_servers: [],
          resource: 'https://example.com',
        })
      );

      await expect(
        service.discoverFromResourceMetadata(
          'https://example.com/.well-known/oauth-protected-resource'
        )
      ).rejects.toThrow('No authorization servers found in resource metadata');
    });

    it('should use default scopes when scopes_supported is not provided', async () => {
      const authMetadataNoScopes = {
        authorization_endpoint: 'https://auth.example.com/authorize',
        token_endpoint: 'https://auth.example.com/token',
        // no scopes_supported
      };

      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://example.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, RESOURCE_METADATA);
        }
        if (url.includes('oauth-authorization-server') || url.includes('openid-configuration')) {
          return mockResponse(200, authMetadataNoScopes);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromResourceMetadata(
        'https://example.com/.well-known/oauth-protected-resource'
      );

      expect(result.scopes).toEqual(['read', 'write']);
    });
  });

  describe('full discovery flow', () => {
    it('should complete full Sentry-like discovery flow', async () => {
      const sentryResourceMetadata = {
        authorization_servers: ['https://sentry.io'],
        resource: 'https://mcp.sentry.dev/mcp',
      };
      const sentryAuthMetadata = {
        authorization_endpoint: 'https://sentry.io/oauth/authorize/',
        token_endpoint: 'https://sentry.io/oauth/token/',
        registration_endpoint: 'https://sentry.io/oauth/register/',
        scopes_supported: ['openid', 'project:read'],
      };

      fetchMock.mockImplementation(async (url: string) => {
        if (url === 'https://mcp.sentry.dev/.well-known/oauth-protected-resource/mcp') {
          return mockResponse(200, sentryResourceMetadata);
        }
        if (url === 'https://sentry.io/.well-known/oauth-authorization-server') {
          return mockResponse(200, sentryAuthMetadata);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://mcp.sentry.dev/mcp');

      expect(result.authorizationServerUrl).toBe('https://sentry.io');
      expect(result.authorizationEndpoint).toBe('https://sentry.io/oauth/authorize/');
      expect(result.tokenEndpoint).toBe('https://sentry.io/oauth/token/');
      expect(result.registrationEndpoint).toBe('https://sentry.io/oauth/register/');
      expect(result.scopes).toEqual(['openid', 'project:read']);
      expect(result.resource).toBe('https://mcp.sentry.dev/mcp');
    });

    it('should complete full Attio-like discovery flow with root fallback', async () => {
      const attioResourceMetadata = {
        authorization_servers: ['https://app.attio.com'],
        resource: 'https://app.attio.com/mcp',
      };
      const attioAuthMetadata = {
        authorization_endpoint: 'https://app.attio.com/authorize',
        token_endpoint: 'https://app.attio.com/oauth/token',
        registration_endpoint: 'https://app.attio.com/oauth/register',
        scopes_supported: ['record_permission:read', 'record_permission:read_write'],
      };

      fetchMock.mockImplementation(async (url: string) => {
        // Path-based returns 404, root succeeds
        if (url === 'https://app.attio.com/.well-known/oauth-protected-resource/mcp') {
          return mockResponse(404);
        }
        if (url === 'https://app.attio.com/.well-known/oauth-protected-resource') {
          return mockResponse(200, attioResourceMetadata);
        }
        if (url === 'https://app.attio.com/.well-known/oauth-authorization-server') {
          return mockResponse(200, attioAuthMetadata);
        }
        return mockResponse(404);
      });

      const result = await service.discoverFromServerUrl('https://app.attio.com/mcp');

      expect(result.authorizationServerUrl).toBe('https://app.attio.com');
      expect(result.registrationEndpoint).toBe('https://app.attio.com/oauth/register');
      expect(result.scopes).toEqual([
        'record_permission:read',
        'record_permission:read_write',
      ]);
    });
  });
});
