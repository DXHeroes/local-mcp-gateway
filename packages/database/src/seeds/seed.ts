/**
 * Prisma database seed script
 *
 * Default profiles are created per-user during signup (in auth.config.ts).
 * Built-in MCP servers are seeded automatically by the backend's
 * McpSeedService when it discovers MCP packages in mcp-servers/.
 * External MCP presets are available via the gallery UI.
 */

import { createPrismaClient } from '../database.js';

const prisma = createPrismaClient();

async function main() {
  console.log('Seeding database...');
  console.log('Profiles are created per-user during signup.');
  console.log('');
  console.log('Note: Built-in MCP servers are seeded automatically when the backend starts.');
  console.log('External MCP presets can be added from the gallery in the UI.');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
