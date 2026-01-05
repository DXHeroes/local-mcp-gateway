/**
 * Shared database instance for better-auth and other services
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { createDatabase } from '@dxheroes/local-mcp-database';
import { getEnv } from './env.js';

const env = getEnv();
const DATABASE_PATH = env.DATABASE_PATH || join(homedir(), '.local-mcp-data', 'local-mcp.db');

// Export shared database instance
export const db = createDatabase(DATABASE_PATH);
