/**
 * NestJS Application Bootstrap
 *
 * Entry point for the Local MCP Gateway backend.
 * No authentication required - immediate access to all features.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
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

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API available at: http://localhost:${port}/api`);
}

bootstrap();
