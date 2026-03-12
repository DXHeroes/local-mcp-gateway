import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter.js';
import { AuthService, type AuthUser } from '../../modules/auth/auth.service.js';
import { McpOAuthGuard } from '../../modules/auth/mcp-oauth.guard.js';
import {
  createMcpProtectedResourceMetadata,
  resolvePublicAuthBaseUrl,
  resolvePublicBackendOrigin,
} from '../../modules/auth/mcp-oauth.utils.js';

type MockAuthService = {
  validateMcpToken: ReturnType<typeof vi.fn>;
};

type MockConfigService = {
  get: ReturnType<typeof vi.fn>;
};

function createConfigService(values: Record<string, unknown>): MockConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

function createAuthServiceMock(): MockAuthService {
  return {
    validateMcpToken: vi.fn().mockResolvedValue(null),
  };
}

async function startTestApp(options: {
  mcpAuthRequired: boolean;
  backendUrl?: string;
}): Promise<{
  close: () => Promise<void>;
  authService: MockAuthService;
  baseUrl: string;
}> {
  const authService = createAuthServiceMock();
  const configService = createConfigService({
    'app.mcpAuthRequired': options.mcpAuthRequired,
    'app.port': 3001,
    BETTER_AUTH_URL: options.backendUrl ?? 'http://localhost:3001',
  });
  const guard = new McpOAuthGuard(authService as unknown as AuthService, configService as never);
  const filter = new AllExceptionsFilter();
  const backendOrigin = resolvePublicBackendOrigin(configService);
  const authBaseUrl = resolvePublicAuthBaseUrl(configService);

  const createRequest = (req: IncomingMessage) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
    return {
      method: req.method ?? 'GET',
      url: `${url.pathname}${url.search}`,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      user: undefined,
    };
  };

  const createResponse = (res: ServerResponse) => {
    const response = {
      setHeader(name: string, value: string) {
        res.setHeader(name, value);
        return response;
      },
      status(statusCode: number) {
        res.statusCode = statusCode;
        return response;
      },
      json(body: unknown) {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      },
    };

    return response;
  };

  const handleGuardedRoute = async (
    nodeRequest: IncomingMessage,
    nodeResponse: ServerResponse,
    responseBody: (request: ReturnType<typeof createRequest>) => Record<string, unknown>
  ) => {
    const request = createRequest(nodeRequest);
    const response = createResponse(nodeResponse);
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as never;

    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as never;

    try {
      await guard.canActivate(context);
      response.json(responseBody(request));
    } catch (error) {
      filter.catch(error, host);
    }
  };

  const server = await new Promise<import('node:http').Server>((resolve) => {
    const listeningServer = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);

      if (req.method === 'GET' && url.pathname === '/api/mcp/test') {
        await handleGuardedRoute(req, res, (request) => ({
          ok: true,
          userId: (request as { user?: AuthUser }).user?.id ?? null,
        }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/mcp/sse') {
        await handleGuardedRoute(req, res, (request) => ({
          ok: true,
          token: request.query.access_token ?? null,
          userId: (request as { user?: AuthUser }).user?.id ?? null,
        }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(createMcpProtectedResourceMetadata(configService)));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/.well-known/oauth-authorization-server') {
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            issuer: backendOrigin,
            authorization_endpoint: `${authBaseUrl}/mcp/authorize`,
            token_endpoint: `${authBaseUrl}/mcp/token`,
            registration_endpoint: `${authBaseUrl}/mcp/register`,
            jwks_uri: `${authBaseUrl}/mcp/jwks`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            code_challenge_methods_supported: ['S256'],
          })
        );
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/mcp/register') {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            client_id: 'cursor-client',
            client_secret: 'cursor-secret',
            redirect_uris: ['https://cursor.sh/callback'],
          })
        );
        return;
      }

      res.statusCode = 404;
      res.end();
    }).listen(0, () => resolve(listeningServer));
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve test server address');
  }

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
    authService,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

describe('MCP proxy auth HTTP contract', () => {
  let close: (() => Promise<void>) | undefined;
  let authService: MockAuthService;
  let baseUrl: string;

  afterEach(async () => {
    if (close) {
      await close();
    }
  });

  describe('when MCP auth is required', () => {
    beforeEach(async () => {
      const result = await startTestApp({
        mcpAuthRequired: true,
        backendUrl: 'http://localhost:9631',
      });
      close = result.close;
      authService = result.authService;
      baseUrl = result.baseUrl;
    });

    it('returns 401 with MCP discovery headers when token is missing', async () => {
      const response = await fetch(`${baseUrl}/api/mcp/test`);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(response.headers.get('access-control-expose-headers')).toBe('WWW-Authenticate');
      expect(response.headers.get('www-authenticate')).toContain('resource_metadata=');
      expect(response.headers.get('www-authenticate')).toContain('resource_metadata_uri=');
      expect(body.message).toBe('Bearer token required');
    });

    it('serves protected resource metadata with Better Auth-backed URLs', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        resource: 'http://localhost:9631/api/mcp',
        authorization_servers: ['http://localhost:9631'],
        bearer_methods_supported: ['header'],
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        jwks_uri: 'http://localhost:9631/api/auth/mcp/jwks',
        resource_signing_alg_values_supported: ['RS256', 'none'],
      });
    });

    it('serves authorization server metadata with MCP registration endpoint', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.registration_endpoint).toBe('http://localhost:9631/api/auth/mcp/register');
      expect(body.authorization_endpoint).toBe('http://localhost:9631/api/auth/mcp/authorize');
      expect(body.token_endpoint).toBe('http://localhost:9631/api/auth/mcp/token');
    });

    it('exposes the advertised registration endpoint', async () => {
      const response = await fetch(`${baseUrl}/api/auth/mcp/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          redirect_uris: ['https://cursor.sh/callback'],
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.client_id).toBe('cursor-client');
    });

    it('accepts access_token query params for SSE fallback', async () => {
      authService.validateMcpToken.mockResolvedValue({
        id: 'user-sse',
        name: 'SSE User',
        email: 'sse@example.com',
      });

      const response = await fetch(`${baseUrl}/api/mcp/sse?access_token=sse-token`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        ok: true,
        token: 'sse-token',
        userId: 'user-sse',
      });
      expect(authService.validateMcpToken).toHaveBeenCalledWith('sse-token');
    });
  });

  it('preserves backward compatibility when MCP auth is disabled', async () => {
    const result = await startTestApp({
      mcpAuthRequired: false,
    });
    close = result.close;
    authService = result.authService;
    baseUrl = result.baseUrl;

    const response = await fetch(`${baseUrl}/api/mcp/test`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      userId: null,
    });
    expect(authService.validateMcpToken).not.toHaveBeenCalled();
  });
});
