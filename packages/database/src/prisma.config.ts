// Prisma config for both development and production
// Paths are relative to this config file location (src/)
export default {
  schema: '../prisma/schema.prisma',
  migrations: {
    path: '../prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
