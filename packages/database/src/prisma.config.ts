// Prisma config for both development and production
// Paths are relative to this config file location (src/)
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../prisma/schema.prisma',
  migrations: {
    path: '../prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
