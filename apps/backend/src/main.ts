/**
 * NestJS Application Bootstrap
 *
 * Entry point for the Local MCP Gateway backend.
 * Better Auth handles /api/auth/* and /.well-known/* routes.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { toNodeHandler } from 'better-auth/node';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { AuthService } from './modules/auth/auth.service.js';
import {
  createMcpProtectedResourceMetadata,
  resolvePublicAuthBaseUrl,
  resolvePublicBackendOrigin,
} from './modules/auth/mcp-oauth.utils.js';

async function bootstrap() {
  // Determine log levels from environment
  const logLevel = process.env.LOG_LEVEL || 'log';
  const logLevels: ('error' | 'warn' | 'log' | 'debug' | 'verbose')[] = ['error'];
  if (['warn', 'log', 'debug', 'verbose'].includes(logLevel)) logLevels.push('warn');
  if (['log', 'debug', 'verbose'].includes(logLevel)) logLevels.push('log');
  if (['debug', 'verbose'].includes(logLevel)) logLevels.push('debug');
  if (logLevel === 'verbose') logLevels.push('verbose');

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  app.use(compression());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Mount Better Auth handler on Express BEFORE app.init() so it registers
  // ahead of NestJS's catch-all 404 handler. We use a lazy wrapper because
  // AuthService.onModuleInit() hasn't run yet — auth initializes during app.init().
  const authService = app.get(AuthService);
  const expressApp = app.getHttpAdapter().getInstance();

  const lazyAuthHandler = async (req: Request, res: Response, next: NextFunction) => {
    const auth = authService.getAuth();
    if (!auth) return next();
    try {
      await toNodeHandler(auth)(req, res);
    } catch (error: unknown) {
      const isPrismaNotFound =
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2025';
      if (isPrismaNotFound) {
        // Stale session cookie — clear it and return 401
        res.clearCookie('better-auth.session_token');
        res.clearCookie('better-auth.session_token.sig');
        if (!res.headersSent) {
          res.status(401).json({ error: 'Session expired' });
        }
        return;
      }
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  expressApp.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    res.json(createMcpProtectedResourceMetadata(configService));
  });

  // RFC 8414 – OAuth 2.0 Authorization Server Metadata
  // MCP clients fetch this to discover the correct DCR endpoint (/api/auth/mcp/register)
  // instead of falling back to the root /register which returns 404.
  expressApp.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
    const backendOrigin = resolvePublicBackendOrigin(configService);
    const authBaseUrl = resolvePublicAuthBaseUrl(configService);

    res.json({
      issuer: backendOrigin,
      authorization_endpoint: `${authBaseUrl}/mcp/authorize`,
      token_endpoint: `${authBaseUrl}/mcp/token`,
      registration_endpoint: `${authBaseUrl}/mcp/register`,
      jwks_uri: `${authBaseUrl}/mcp/jwks`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    });
  });

  expressApp.all('/api/auth/*splat', lazyAuthHandler);
  expressApp.all('/.well-known/*splat', lazyAuthHandler);

  logger.log('Better Auth routes registered (lazy) on /api/auth/* and /.well-known/*');

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API available at: http://localhost:${port}/api`);
  logger.log('Auth: always enabled (email+password baseline)');
}

bootstrap();
