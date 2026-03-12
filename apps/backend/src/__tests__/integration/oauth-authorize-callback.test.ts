import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthController } from '../../modules/oauth/oauth.controller.js';
import { OAuthService } from '../../modules/oauth/oauth.service.js';

function createOAuthServiceMock() {
  return {
    discoverAndAuthorize: vi.fn(),
    handleCallback: vi.fn(),
  };
}

describe('OAuth authorize and callback HTTP contract', () => {
  let close: (() => Promise<void>) | undefined;
  let oauthService: ReturnType<typeof createOAuthServiceMock>;
  let baseUrl: string;

  beforeEach(async () => {
    oauthService = createOAuthServiceMock();
    const controller = new OAuthController(oauthService as unknown as OAuthService);

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const listeningServer = createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
        const request = {
          protocol: 'http',
          query: Object.fromEntries(url.searchParams.entries()),
          get: (headerName: string) => {
            if (headerName.toLowerCase() === 'host') {
              return req.headers.host ?? '';
            }
            return undefined;
          },
        };
        const response = {
          redirect(location: string) {
            res.statusCode = 302;
            res.setHeader('location', location);
            res.end();
          },
          status(statusCode: number) {
            res.statusCode = statusCode;
            return response;
          },
          send(body: string) {
            res.setHeader('content-type', 'text/html; charset=utf-8');
            res.end(body);
          },
        };

        if (req.method === 'GET' && url.pathname.startsWith('/api/oauth/authorize/')) {
          const serverId = url.pathname.split('/').pop() ?? '';
          await controller.authorize(serverId, request as never, response as never);
          return;
        }

        if (req.method === 'GET' && url.pathname === '/api/oauth/callback') {
          await controller.callback(
            typeof request.query.code === 'string' ? request.query.code : '',
            typeof request.query.state === 'string' ? request.query.state : '',
            request as never,
            response as never
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

    close = () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (close) {
      await close();
    }
  });

  it('redirects authorize requests to the discovered authorization URL', async () => {
    oauthService.discoverAndAuthorize.mockResolvedValue('https://auth.example.com/authorize?client_id=abc');

    const response = await fetch(`${baseUrl}/api/oauth/authorize/server-1`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://auth.example.com/authorize?client_id=abc');
    expect(oauthService.discoverAndAuthorize).toHaveBeenCalledWith(
      'server-1',
      `${baseUrl}/api/oauth/callback`
    );
  });

  it('renders an error page when authorize discovery fails', async () => {
    oauthService.discoverAndAuthorize.mockRejectedValue(new Error('Metadata discovery failed'));

    const response = await fetch(`${baseUrl}/api/oauth/authorize/server-1`);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Error: Metadata discovery failed');
  });

  it('rejects callbacks without code or state', async () => {
    const response = await fetch(`${baseUrl}/api/oauth/callback`);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Missing code or state parameter');
  });

  it('renders a success page for valid callbacks', async () => {
    oauthService.handleCallback.mockResolvedValue({ success: true });

    const response = await fetch(`${baseUrl}/api/oauth/callback?code=auth-code&state=server-1`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Authorization successful! This window will close.');
    expect(oauthService.handleCallback).toHaveBeenCalledWith(
      'server-1',
      'auth-code',
      `${baseUrl}/api/oauth/callback`
    );
  });

  it('renders a failure page when callback token exchange fails', async () => {
    oauthService.handleCallback.mockResolvedValue({
      success: false,
      error: 'Token exchange failed',
    });

    const response = await fetch(`${baseUrl}/api/oauth/callback?code=auth-code&state=server-1`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Error: Token exchange failed');
  });
});
