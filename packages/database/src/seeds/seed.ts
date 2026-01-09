/**
 * Prisma database seed script
 *
 * Creates initial data for the application:
 * - Default profile
 * - Context7 MCP Server (external remote HTTP server)
 *
 * Note: Built-in MCP servers are seeded automatically by the backend's
 * McpSeedService when it discovers MCP packages in mcp-servers/.
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default profile
  const defaultProfile = await prisma.profile.upsert({
    where: { name: 'default' },
    update: {},
    create: {
      name: 'default',
      description: 'Default MCP profile for general use',
    },
  });

  console.log('✅ Created default profile:', defaultProfile.id);

  // Create Context7 MCP Server (if not exists)
  let context7Server = await prisma.mcpServer.findFirst({
    where: { name: 'Context7' },
  });

  if (!context7Server) {
    context7Server = await prisma.mcpServer.create({
      data: {
        name: 'Context7',
        type: 'remote_http',
        config: JSON.stringify({ url: 'https://mcp.context7.com/mcp' }),
      },
    });
    console.log('✅ Created Context7 MCP server:', context7Server.id);
  } else {
    console.log('ℹ️ Context7 MCP server already exists:', context7Server.id);
  }

  // Link Context7 to default profile (if not already linked)
  const existingLink = await prisma.profileMcpServer.findUnique({
    where: {
      profileId_mcpServerId: {
        profileId: defaultProfile.id,
        mcpServerId: context7Server.id,
      },
    },
  });

  if (!existingLink) {
    await prisma.profileMcpServer.create({
      data: {
        profileId: defaultProfile.id,
        mcpServerId: context7Server.id,
        order: 0,
      },
    });
    console.log('✅ Linked Context7 to default profile');
  } else {
    console.log('ℹ️ Context7 already linked to default profile');
  }

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Note: Built-in MCP servers will be seeded automatically when the backend starts');
  console.log('and discovers MCP packages in the mcp-servers/ directory.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
