# Changelog

## [0.1.8](https://github.com/DXHeroes/local-mcp-gateway/compare/database-v0.1.7...database-v0.1.8) (2026-01-13)


### Documentation

* update project documentation and configuration ([35ddbef](https://github.com/DXHeroes/local-mcp-gateway/commit/35ddbef46397c381e207960450b3a9653ba11d2c))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.1.6
  * peerDependencies
    * @dxheroes/local-mcp-core bumped to 0.1.6

## [0.1.7](https://github.com/DXHeroes/local-mcp-gateway/compare/database-v0.1.6...database-v0.1.7) (2026-01-13)


### Features

* add Docker entrypoint script and update Dockerfile for database migrations ([04374f3](https://github.com/DXHeroes/local-mcp-gateway/commit/04374f3bbe6b331705f6d89bcab2f62899e9d539))
* Enhance debugging capabilities by integrating DebugService into McpService for logging requests and responses; update DebugLog model to allow optional profileId and mcpServerId. ([7d6f313](https://github.com/DXHeroes/local-mcp-gateway/commit/7d6f313ac92ee8be5e91b4a0ebc6a3ba26907a83))
* Introduce automated release management with release-please, consolidate CI/CD workflows, and update package metadata for publishing. ([9c66582](https://github.com/DXHeroes/local-mcp-gateway/commit/9c665828c0e06d95554b28b71ddf6769ffc3ea94))
* update Docker and Nginx configurations for improved local and production setups. Modify docker-compose.yml for data persistence and HTTPS support, enhance README with usage instructions, and implement self-signed certificate generation in Docker. Refactor backend and frontend scripts for better API integration and environment handling. ([3efef5a](https://github.com/DXHeroes/local-mcp-gateway/commit/3efef5a1c667ede1f0b943b662abb51555a001c4))


### Bug Fixes

* Integrate UI package styles directly into the frontend, enhance Vite and Turborepo build configurations, and configure the database package as an ES module. ([f9357db](https://github.com/DXHeroes/local-mcp-gateway/commit/f9357dbc791c836141c28c865869838ee664b295))
* test ([e4d787a](https://github.com/DXHeroes/local-mcp-gateway/commit/e4d787ae4b4e4798d08b9f8c9c7fda9d9f469c9c))
* test ([e4d787a](https://github.com/DXHeroes/local-mcp-gateway/commit/e4d787ae4b4e4798d08b9f8c9c7fda9d9f469c9c))
* update Dockerfiles to use Node 22 and enhance database handling ([d14c83a](https://github.com/DXHeroes/local-mcp-gateway/commit/d14c83a89581ad63e6a8b34850cff22a6a7df9d6))
* update test setups and type imports, and add a new `check` script ([a5fe692](https://github.com/DXHeroes/local-mcp-gateway/commit/a5fe692fca5c803da78e52255a43a96bd1e97ab9))


### Code Refactoring

* Rename packages from `[@local-mcp](https://github.com/local-mcp)` to `@dxheroes/local-mcp` and update project naming to Local MCP Gateway. ([629f034](https://github.com/DXHeroes/local-mcp-gateway/commit/629f0341a20336a371a04324dc399f9a3e6632eb))
* update Docker configurations and Prisma setup ([880878f](https://github.com/DXHeroes/local-mcp-gateway/commit/880878f18745b60045aeb0dc61a8e2441b506908))
* update for OS ([56e4118](https://github.com/DXHeroes/local-mcp-gateway/commit/56e41182029ac000da3ef0b4beb970b7d02f2970))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.1.5
  * peerDependencies
    * @dxheroes/local-mcp-core bumped to 0.1.5

## [0.1.6](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.5...local-mcp-database-v0.1.6) (2026-01-12)


### Bug Fixes

* update Dockerfiles to use Node 22 and enhance database handling ([d14c83a](https://github.com/DXHeroes/local-mcp-gateway/commit/d14c83a89581ad63e6a8b34850cff22a6a7df9d6))

## [0.1.5](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.4...local-mcp-database-v0.1.5) (2026-01-12)


### Features

* add Docker entrypoint script and update Dockerfile for database migrations ([04374f3](https://github.com/DXHeroes/local-mcp-gateway/commit/04374f3bbe6b331705f6d89bcab2f62899e9d539))


### Code Refactoring

* update Docker configurations and Prisma setup ([880878f](https://github.com/DXHeroes/local-mcp-gateway/commit/880878f18745b60045aeb0dc61a8e2441b506908))

## [0.1.4](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.3...local-mcp-database-v0.1.4) (2026-01-12)


### Bug Fixes

* test ([e4d787a](https://github.com/DXHeroes/local-mcp-gateway/commit/e4d787ae4b4e4798d08b9f8c9c7fda9d9f469c9c))
* test ([e4d787a](https://github.com/DXHeroes/local-mcp-gateway/commit/e4d787ae4b4e4798d08b9f8c9c7fda9d9f469c9c))

## [0.1.3](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.2...local-mcp-database-v0.1.3) (2026-01-12)


### Features

* Enhance debugging capabilities by integrating DebugService into McpService for logging requests and responses; update DebugLog model to allow optional profileId and mcpServerId. ([7d6f313](https://github.com/DXHeroes/local-mcp-gateway/commit/7d6f313ac92ee8be5e91b4a0ebc6a3ba26907a83))


### Bug Fixes

* Integrate UI package styles directly into the frontend, enhance Vite and Turborepo build configurations, and configure the database package as an ES module. ([f9357db](https://github.com/DXHeroes/local-mcp-gateway/commit/f9357dbc791c836141c28c865869838ee664b295))


### Code Refactoring

* update for OS ([56e4118](https://github.com/DXHeroes/local-mcp-gateway/commit/56e41182029ac000da3ef0b4beb970b7d02f2970))

## [0.1.3](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.2...local-mcp-database-v0.1.3) (2026-01-12)


### Features

* Enhance debugging capabilities by integrating DebugService into McpService for logging requests and responses; update DebugLog model to allow optional profileId and mcpServerId. ([7d6f313](https://github.com/DXHeroes/local-mcp-gateway/commit/7d6f313ac92ee8be5e91b4a0ebc6a3ba26907a83))


### Bug Fixes

* Integrate UI package styles directly into the frontend, enhance Vite and Turborepo build configurations, and configure the database package as an ES module. ([f9357db](https://github.com/DXHeroes/local-mcp-gateway/commit/f9357dbc791c836141c28c865869838ee664b295))


### Code Refactoring

* update for OS ([56e4118](https://github.com/DXHeroes/local-mcp-gateway/commit/56e41182029ac000da3ef0b4beb970b7d02f2970))

## [0.1.2](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.1...local-mcp-database-v0.1.2) (2025-11-19)


### Bug Fixes

* update test setups and type imports, and add a new `check` script ([a5fe692](https://github.com/DXHeroes/local-mcp-gateway/commit/a5fe692fca5c803da78e52255a43a96bd1e97ab9))

## [0.1.1](https://github.com/DXHeroes/local-mcp-gateway/compare/local-mcp-database-v0.1.0...local-mcp-database-v0.1.1) (2025-11-19)


### Features

* Introduce automated release management with release-please, consolidate CI/CD workflows, and update package metadata for publishing. ([9c66582](https://github.com/DXHeroes/local-mcp-gateway/commit/9c665828c0e06d95554b28b71ddf6769ffc3ea94))
* update Docker and Nginx configurations for improved local and production setups. Modify docker-compose.yml for data persistence and HTTPS support, enhance README with usage instructions, and implement self-signed certificate generation in Docker. Refactor backend and frontend scripts for better API integration and environment handling. ([3efef5a](https://github.com/DXHeroes/local-mcp-gateway/commit/3efef5a1c667ede1f0b943b662abb51555a001c4))


### Code Refactoring

* Rename packages from `[@local-mcp](https://github.com/local-mcp)` to `@dxheroes/local-mcp` and update project naming to Local MCP Gateway. ([629f034](https://github.com/DXHeroes/local-mcp-gateway/commit/629f0341a20336a371a04324dc399f9a3e6632eb))
