/**
 * Database configuration
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Parse DATABASE_URL for path
  const databaseUrl = process.env.DATABASE_URL;

  // Default path if not set
  const defaultPath = join(homedir(), '.local-mcp-gateway-data', 'local-mcp-gateway.db');

  // Extract path from file: URL
  let path = defaultPath;
  if (databaseUrl?.startsWith('file:')) {
    const filePath = databaseUrl.replace('file:', '');
    if (!filePath.startsWith(':memory:')) {
      // Handle relative paths (./dev.db)
      if (filePath.startsWith('./')) {
        path = join(process.cwd(), filePath.slice(2));
      } else {
        path = filePath;
      }
    }
  }

  return {
    url: databaseUrl || `file:${defaultPath}`,
    path,
  };
});
