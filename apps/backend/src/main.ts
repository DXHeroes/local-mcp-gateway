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
import { createMcpProtectedResourceMetadata } from './modules/auth/mcp-oauth.utils.js';

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

  const lazyAuthHandler = (req: Request, res: Response, next: NextFunction) => {
    const auth = authService.getAuth();
    if (!auth) return next();
    toNodeHandler(auth)(req, res);
  };

  expressApp.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    res.json(createMcpProtectedResourceMetadata(configService));
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
