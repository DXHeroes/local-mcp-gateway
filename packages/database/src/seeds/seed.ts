/**
 * Prisma database seed script
 *
 * Creates initial data for the application:
 * - Default system profile (for non-auth/unauthenticated access)
 *
 * Note: Built-in MCP servers are seeded automatically by the backend's
 * McpSeedService when it discovers MCP packages in mcp-servers/.
 * External MCP presets are available via the gallery UI.
 */

import { createPrismaClient } from '../database.js';

const prisma = createPrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default system profile (organizationId=null) for unauthenticated access
  let defaultProfile = await prisma.profile.findFirst({
    where: { name: 'default', organizationId: null },
  });

  if (!defaultProfile) {
    defaultProfile = await prisma.profile.create({
      data: {
        name: 'default',
        description: 'Default MCP profile for unauthenticated access',
        organizationId: null,
      },
    });
    console.log('Created default system profile:', defaultProfile.id);
  } else {
    console.log('Default system profile already exists:', defaultProfile.id);
  }

  console.log('Seeding complete!');
  console.log('');
  console.log('Note: Built-in MCP servers are seeded automatically when the backend starts.');
  console.log('External MCP presets can be added from the gallery in the UI.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
