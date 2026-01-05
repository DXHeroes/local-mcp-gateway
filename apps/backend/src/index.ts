/**
 * Backend entry point
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
// Database is imported from @dxheroes/local-mcp-database package
// better-sqlite3 is a dependency of @dxheroes/local-mcp-database
import { ApiKeyManager, LicenseKeyService, OAuthManager, ProfileManager } from '@dxheroes/local-mcp-core';
import {
  createDatabase,
  DebugLogRepository,
  LicenseActivationRepository,
  LicenseKeyRepository,
  McpServerRepository,
  McpServerToolsCacheRepository,
  OAuthTokenRepository,
  OrganizationRepository,
  ProfileMcpServerRepository,
  ProfileMcpServerToolRepository,
  ProfileRepository,
  SubscriptionRepository,
  UserRepository,
  runMigrations,
  runSeeds,
} from '@dxheroes/local-mcp-database';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { getEnv } from './lib/env.js';
import { logger } from './lib/logger.js';
import { auth } from './lib/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter, mcpProxyLimiter } from './middleware/rate-limiting.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requireAuth } from './middleware/requireAuth.js';
import { createDebugRoutes } from './routes/debug.js';
import { createLicenseRoutes } from './routes/licenses.js';
import { createMcpServerRoutes } from './routes/mcp-servers.js';
import { createOAuthRoutes } from './routes/oauth.js';
import { createProfileRoutes } from './routes/profiles.js';
import { createProfileToolsRoutes } from './routes/profile-tools.js';
import { createProxyRoutes } from './routes/proxy.js';
import { createSubscriptionRoutes } from './routes/subscriptions.js';

// Validate environment variables
const env = getEnv();

const app = express();
const PORT = env.PORT;
const DATABASE_PATH = env.DATABASE_PATH || join(homedir(), '.local-mcp-data', 'local-mcp.db');

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

// Better Auth handler - MUST be before express.json()
app.use('/api/auth', toNodeHandler(auth));

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
    const profileMcpServerToolRepository = new ProfileMcpServerToolRepository(db);
    const mcpServerToolsCacheRepository = new McpServerToolsCacheRepository(db);

    // Initialize monetization repositories
    // @ts-expect-error - Reserved for future user management routes
    const _userRepository = new UserRepository(db);
    // @ts-expect-error - Reserved for future organization routes
    const _organizationRepository = new OrganizationRepository(db);
    const subscriptionRepository = new SubscriptionRepository(db);
    const licenseKeyRepository = new LicenseKeyRepository(db);
    const licenseActivationRepository = new LicenseActivationRepository(db);

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

    // Initialize services (conditionally if env vars are present)
    let licenseKeyService: LicenseKeyService | null = null;

    if (env.LICENSE_PRIVATE_KEY && env.LICENSE_PUBLIC_KEY) {
      licenseKeyService = new LicenseKeyService(
        env.LICENSE_PRIVATE_KEY,
        env.LICENSE_PUBLIC_KEY
      );
      logger.info('License key service initialized');
    } else {
      logger.warn('License keys not set - license key generation disabled');
    }

    // API routes
    app.use(
      '/api/profiles',
      apiLimiter,
      createProfileRoutes(profileManager, profileMcpServerRepository)
    );
    app.use(
      '/api/profiles/:profileId/servers/:serverId',
      apiLimiter,
      createProfileToolsRoutes(
        profileManager,
        mcpServerRepository,
        profileMcpServerToolRepository,
        mcpServerToolsCacheRepository,
        oauthTokenRepository
      )
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

    // Protected routes (require authentication)
    app.use(
      '/api/subscriptions',
      apiLimiter,
      requireAuth,
      createSubscriptionRoutes(subscriptionRepository)
    );

    // License routes (validate & heartbeat don't require auth, others do)
    if (licenseKeyService) {
      app.use(
        '/api/licenses',
        apiLimiter,
        createLicenseRoutes(licenseKeyRepository, licenseActivationRepository, licenseKeyService)
      );
    }

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
