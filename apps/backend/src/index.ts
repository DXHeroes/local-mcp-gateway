/**
 * Backend entry point
 */

import { dirname, join } from 'node:path';
// Database is imported from @local-mcp/database package
// better-sqlite3 is a dependency of @local-mcp/database
import { fileURLToPath } from 'node:url';
import { ApiKeyManager, OAuthManager, ProfileManager } from '@local-mcp/core';
import {
  createDatabase,
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileMcpServerRepository,
  ProfileRepository,
  runMigrations,
  runSeeds,
} from '@local-mcp/database';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { getEnv } from './lib/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter, mcpProxyLimiter } from './middleware/rate-limiting.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { createDebugRoutes } from './routes/debug.js';
import { createMcpServerRoutes } from './routes/mcp-servers.js';
import { createOAuthRoutes } from './routes/oauth.js';
import { createProfileRoutes } from './routes/profiles.js';
import { createProxyRoutes } from './routes/proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
const env = getEnv();

const app = express();
const PORT = env.PORT;
const DATABASE_PATH = env.DATABASE_PATH || join(__dirname, '../../../../data/local-mcp.db');

// Initialize database
async function initializeDatabase() {
  // Ensure data directory exists
  const { mkdirSync } = await import('node:fs');
  const { dirname: dirnamePath } = await import('node:path');
  const dbDir = dirnamePath(DATABASE_PATH);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch {
    // Directory already exists
  }

  // Run migrations
  await runMigrations(DATABASE_PATH);

  // Run seeds
  await runSeeds(DATABASE_PATH);
}

// Export seeds for use in migration-runner
export { runSeeds };

// Middleware
app.use(requestIdMiddleware);
app.use(compression());
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// Health check endpoint (before database initialization)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    const db = createDatabase(DATABASE_PATH);

    // Initialize repositories
    const profileRepository = new ProfileRepository(db);
    const mcpServerRepository = new McpServerRepository(db);
    const oauthTokenRepository = new OAuthTokenRepository(db);
    const debugLogRepository = new DebugLogRepository(db);
    const profileMcpServerRepository = new ProfileMcpServerRepository(db);

    // Initialize managers
    const profileManager = new ProfileManager(profileRepository);
    const oauthManager = new OAuthManager(oauthTokenRepository, {
      async store() {
        // Placeholder for DCR - will be implemented when needed
      },
      async get() {
        return null;
      },
    });
    // API key manager will be used when implementing API key routes
    void new ApiKeyManager({
      async store() {
        // Placeholder - will be implemented with database repository
      },
      async get() {
        return null;
      },
      async delete() {
        // Placeholder
      },
    });

    // API routes
    app.use(
      '/api/profiles',
      apiLimiter,
      createProfileRoutes(profileManager, profileMcpServerRepository)
    );
    app.use(
      '/api/mcp-servers',
      apiLimiter,
      createMcpServerRoutes(
        mcpServerRepository,
        oauthTokenRepository,
        debugLogRepository,
        profileRepository
      )
    );
    app.use(
      '/api/mcp',
      mcpProxyLimiter,
      createProxyRoutes(
        profileRepository,
        mcpServerRepository,
        oauthTokenRepository,
        debugLogRepository,
        profileMcpServerRepository
      )
    );
    app.use('/api/oauth', apiLimiter, createOAuthRoutes(oauthManager, mcpServerRepository));
    app.use('/api/debug', apiLimiter, createDebugRoutes(debugLogRepository));

    // Enhanced health check with database connectivity (after repositories are initialized)
    app.get('/health/ready', async (_req, res) => {
      try {
        // Test database connectivity - try to query profiles table
        const profiles = await profileRepository.findAll();
        // Just verify we got a result (even if empty array)
        if (!Array.isArray(profiles)) {
          throw new Error('Database query returned invalid result');
        }
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: 'connected',
        });
      } catch (error) {
        logger.error('Health check failed', { error });
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        });
      }
    });

    // Error handler (must be last)
    app.use(errorHandler);

    // Check if port is available before starting
    const server = app.listen(PORT, () => {
      logger.info(`Backend server running on http://localhost:${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Handle port already in use error
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use!`, {
          port: PORT,
          error: error.message,
        });
        logger.error(
          'Please stop the process using this port or change the PORT environment variable.'
        );
        process.exit(1);
      } else {
        logger.error('Server error:', { error: error.message });
        process.exit(1);
      }
    });
  })
  .catch((error) => {
    logger.error('Failed to initialize database', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  });
