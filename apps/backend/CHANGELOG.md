# Changelog

## [0.16.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.15.0...backend-v0.16.0) (2026-04-01)


### Features

* **auth:** implement email/password signup modes and validation ([a772b51](https://github.com/DXHeroes/local-mcp-gateway/commit/a772b51acd00255ba7fb4c316e00ad49374c9b62))
* **debug:** implement summary endpoint and enhance debug logs overview ([675650a](https://github.com/DXHeroes/local-mcp-gateway/commit/675650a47260401b4cf07daefabe4ff5e06349b3))
* **mcp:** add byzdata Czech business registry MCP package ([c42d2b8](https://github.com/DXHeroes/local-mcp-gateway/commit/c42d2b8aebc2a93271fafce9cc32cf477973d43e))
* **mcp:** map OAuth token from Prisma types to core OAuthToken in McpService ([f4bb2e9](https://github.com/DXHeroes/local-mcp-gateway/commit/f4bb2e9636ba0945352a1bd5a34ca0524c8c6c13))
* **proxy:** enhance tool execution handling and server aggregation ([fc83803](https://github.com/DXHeroes/local-mcp-gateway/commit/fc838037c160a66fa010143f07de2bb421410549))


### Bug Fixes

* **proxy:** invalidate cached server instances when API key changes ([9ab8898](https://github.com/DXHeroes/local-mcp-gateway/commit/9ab8898deb20e373d026d14c032b4fb2e5335ced))
* **proxy:** streamline error response handling in ProxyService ([b9f371e](https://github.com/DXHeroes/local-mcp-gateway/commit/b9f371e800aaed357a55ebf65b312c4aeb599927))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.10.3
    * @dxheroes/local-mcp-database bumped to 0.7.3
    * @dxheroes/mcp-abra-flexi bumped to 0.4.4
    * @dxheroes/mcp-fakturoid bumped to 0.5.2
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.12
    * @dxheroes/mcp-merk bumped to 0.4.2
    * @dxheroes/mcp-toggl bumped to 0.3.12
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.17

## [0.15.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.14.0...backend-v0.15.0) (2026-03-18)


### Features

* **debug:** enhance logging retrieval with pagination and filtering support ([815f268](https://github.com/DXHeroes/local-mcp-gateway/commit/815f2686f1ec44ee81bd6455509254fea21cf8c1))
* **logging:** implement structured logging and error handling across services ([5de103a](https://github.com/DXHeroes/local-mcp-gateway/commit/5de103a22bf25a7780437e89e67b6526d2b5b894))
* **profiles:** implement getInfo method for profile aggregation ([1a8efb4](https://github.com/DXHeroes/local-mcp-gateway/commit/1a8efb4bd3e199ee9355646850ca86179f39f6a7))
* **proxy:** enhance profile retrieval with user context ([de5ba86](https://github.com/DXHeroes/local-mcp-gateway/commit/de5ba86dfdd370e84cfe5b5b2a261dda6b63e2ee))


### Code Refactoring

* **tests:** improve type handling and error management in proxy-auth tests ([74c7a61](https://github.com/DXHeroes/local-mcp-gateway/commit/74c7a61f11ae66581aa9f8340940e30b479935f1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.10.2
    * @dxheroes/local-mcp-database bumped to 0.7.2
    * @dxheroes/mcp-abra-flexi bumped to 0.4.3
    * @dxheroes/mcp-fakturoid bumped to 0.5.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.11
    * @dxheroes/mcp-merk bumped to 0.4.1
    * @dxheroes/mcp-toggl bumped to 0.3.11
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.16

## [0.14.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.13.0...backend-v0.14.0) (2026-03-18)


### Features

* **proxy:** add argument coercion for Merk search tool calls ([b9c9a0c](https://github.com/DXHeroes/local-mcp-gateway/commit/b9c9a0c3f0bc91fc1aca493fdb828271190c805c))
* **proxy:** implement argument coercion for tool calls based on input schema ([e9ac930](https://github.com/DXHeroes/local-mcp-gateway/commit/e9ac930a7b739590577075fce146a80c157f0708))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.10.1
    * @dxheroes/local-mcp-database bumped to 0.7.1
    * @dxheroes/mcp-abra-flexi bumped to 0.4.2
    * @dxheroes/mcp-fakturoid bumped to 0.5.0
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.10
    * @dxheroes/mcp-merk bumped to 0.4.0
    * @dxheroes/mcp-toggl bumped to 0.3.10
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.15

## [0.13.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.12.0...backend-v0.13.0) (2026-03-16)


### Features

* **mcp:** implement server-level tool configuration management ([f8a1f58](https://github.com/DXHeroes/local-mcp-gateway/commit/f8a1f58d28c4da9a8a05034b1665ba2f58338d01))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.10.0
    * @dxheroes/local-mcp-database bumped to 0.7.0
    * @dxheroes/mcp-abra-flexi bumped to 0.4.1
    * @dxheroes/mcp-fakturoid bumped to 0.4.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.9
    * @dxheroes/mcp-merk bumped to 0.3.9
    * @dxheroes/mcp-toggl bumped to 0.3.9
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.14

## [0.12.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.11.0...backend-v0.12.0) (2026-03-16)


### Features

* **auth:** improve user organization handling during signup ([8447d08](https://github.com/DXHeroes/local-mcp-gateway/commit/8447d08e55274973e33d97fcc3b66a269b96be51))
* **docs:** enhance documentation and user onboarding experience ([27adcf5](https://github.com/DXHeroes/local-mcp-gateway/commit/27adcf58b55926406fdc2a926a61ccfb92fad798))
* **invitation:** implement organization invitation acceptance flow ([c3731c2](https://github.com/DXHeroes/local-mcp-gateway/commit/c3731c2e0ced853fa37868b9f560edb4bf0cff2f))
* **mcp:** enhance MCP presets and server configuration ([d5ce8f3](https://github.com/DXHeroes/local-mcp-gateway/commit/d5ce8f3adb9513c03df2e97c2ba1236926350387))
* **mcp:** enrich server creation with metadata and enhance documentation ([fb3d901](https://github.com/DXHeroes/local-mcp-gateway/commit/fb3d901d4ab97308732dbdb15218ec9968cf56c9))
* **mcp:** streamline MCP presets and enhance server configuration ([9eb1f2c](https://github.com/DXHeroes/local-mcp-gateway/commit/9eb1f2c17ae8dea5d7d8035474adcfde9da56474))
* **organization-domains:** add auto-join domain management for organizations ([2e5071d](https://github.com/DXHeroes/local-mcp-gateway/commit/2e5071d82811725df5ef1729cc2f657d11fade14))
* **organization-domains:** implement blacklisted domains for auto-join prevention ([5226d48](https://github.com/DXHeroes/local-mcp-gateway/commit/5226d481b94b6fd192cfe46e385143b0f642a4d5))
* **tests:** enhance integration tests for MCP services and sharing functionality ([d4550ba](https://github.com/DXHeroes/local-mcp-gateway/commit/d4550baefb3e623500e444cb6cbcfd911b88fefb))


### Bug Fixes

* **oauth:** standardize token type casing and enhance error logging ([47ef48b](https://github.com/DXHeroes/local-mcp-gateway/commit/47ef48ba45be779b059bf32faa062af2cea3eee4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.9.0
    * @dxheroes/local-mcp-database bumped to 0.6.0
    * @dxheroes/mcp-abra-flexi bumped to 0.4.0
    * @dxheroes/mcp-fakturoid bumped to 0.4.0
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.8
    * @dxheroes/mcp-merk bumped to 0.3.8
    * @dxheroes/mcp-toggl bumped to 0.3.8
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.13

## [0.11.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.10.0...backend-v0.11.0) (2026-03-16)


### Features

* **auth:** enable toggle for email and password authentication ([a0c1dd0](https://github.com/DXHeroes/local-mcp-gateway/commit/a0c1dd0a192ffd4199af2bb00d9e83f1c526be5c))
* **auth:** enhance MCP OAuth guard to support session cookies ([cc2f0d0](https://github.com/DXHeroes/local-mcp-gateway/commit/cc2f0d092150710691e8258c2fa3d891575e5a76))
* **dependencies:** add new MCP packages to backend dependencies ([a29fdf4](https://github.com/DXHeroes/local-mcp-gateway/commit/a29fdf4c4af4db0b4df31a9b8a7d7f0fec5a5755))
* **seo:** enhance SEO and session handling across frontend and backend ([2178043](https://github.com/DXHeroes/local-mcp-gateway/commit/21780436a9e93da63e3c6cec8318b4f8d1a6dbf6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.8.1
    * @dxheroes/local-mcp-database bumped to 0.5.4
    * @dxheroes/mcp-abra-flexi bumped to 0.3.3
    * @dxheroes/mcp-fakturoid bumped to 0.3.3
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.7
    * @dxheroes/mcp-merk bumped to 0.3.7
    * @dxheroes/mcp-toggl bumped to 0.3.7
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.12

## [0.10.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.9.2...backend-v0.10.0) (2026-03-12)


### Features

* **auth:** implement MCP OAuth guard and enhance authentication flow ([14f6355](https://github.com/DXHeroes/local-mcp-gateway/commit/14f6355b7e3e1d2a2a757643c7bc1946aa1e09cd))
* enhance OAuth integration and add custom headers support for MCP servers ([0904743](https://github.com/DXHeroes/local-mcp-gateway/commit/09047436072810f5876a2c92ba47f6f90f8f6103))


### Code Refactoring

* **auth:** streamline MCP OAuth guard and enhance configuration ([38972a3](https://github.com/DXHeroes/local-mcp-gateway/commit/38972a3c94c377d8f5d6c9c714d6ccab91765a99))
* **database:** update OAuth models and migrations for improved schema ([a92b074](https://github.com/DXHeroes/local-mcp-gateway/commit/a92b07400050b30decdda1dc82f4647d49c38c91))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.8.0
    * @dxheroes/local-mcp-database bumped to 0.5.3
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.6
    * @dxheroes/mcp-merk bumped to 0.3.6
    * @dxheroes/mcp-toggl bumped to 0.3.6
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.11

## [0.9.2](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.9.1...backend-v0.9.2) (2026-03-11)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.7.2
    * @dxheroes/local-mcp-database bumped to 0.5.2
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.5
    * @dxheroes/mcp-merk bumped to 0.3.5
    * @dxheroes/mcp-toggl bumped to 0.3.5
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.10

## [0.9.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.9.0...backend-v0.9.1) (2026-03-11)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.7.1
    * @dxheroes/local-mcp-database bumped to 0.5.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.4
    * @dxheroes/mcp-merk bumped to 0.3.4
    * @dxheroes/mcp-toggl bumped to 0.3.4
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.9

## [0.9.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.8.0...backend-v0.9.0) (2026-03-10)


### Features

* add mandatory org context, Better Auth, and MCP preset gallery ([18ddf94](https://github.com/DXHeroes/local-mcp-gateway/commit/18ddf94d5269a9b77e9e251b96b6fc56bd496ad1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.7.0
    * @dxheroes/local-mcp-database bumped to 0.5.0
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.3
    * @dxheroes/mcp-merk bumped to 0.3.3
    * @dxheroes/mcp-toggl bumped to 0.3.3
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.8

## [0.8.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.7.1...backend-v0.8.0) (2026-03-10)


### Features

* **mcp:** add Python/uv to Docker image and re-add Fetch MCP preset ([f4943ea](https://github.com/DXHeroes/local-mcp-gateway/commit/f4943ea91e1dfc1356dab5c0423cb5d26c5f7ecf))


### Bug Fixes

* **mcp:** fix broken external MCP preset package names ([938038f](https://github.com/DXHeroes/local-mcp-gateway/commit/938038f0c3a86283bd91ec7d3066728b350b6c1f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.6.2
    * @dxheroes/local-mcp-database bumped to 0.4.7
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.2
    * @dxheroes/mcp-merk bumped to 0.3.2
    * @dxheroes/mcp-toggl bumped to 0.3.2
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.7

## [0.7.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.7.0...backend-v0.7.1) (2026-03-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.6.1
    * @dxheroes/local-mcp-database bumped to 0.4.6
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.1
    * @dxheroes/mcp-merk bumped to 0.3.1
    * @dxheroes/mcp-toggl bumped to 0.3.1
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.6

## [0.7.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.6.2...backend-v0.7.0) (2026-03-09)


### Features

* **mcp:** introduce external MCP server support and enhance seeding functionality ([9f99183](https://github.com/DXHeroes/local-mcp-gateway/commit/9f99183d02c42a572bc82c7c599822d4feb4a4b8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.6.0
    * @dxheroes/local-mcp-database bumped to 0.4.5
    * @dxheroes/mcp-gemini-deep-research bumped to 0.5.0
    * @dxheroes/mcp-merk bumped to 0.3.0
    * @dxheroes/mcp-toggl bumped to 0.3.0
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.5

## [0.6.2](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.6.1...backend-v0.6.2) (2026-02-02)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.5.0
    * @dxheroes/local-mcp-database bumped to 0.4.4
    * @dxheroes/mcp-gemini-deep-research bumped to 0.4.4
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.4

## [0.6.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.6.0...backend-v0.6.1) (2026-01-16)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.4.3
    * @dxheroes/local-mcp-database bumped to 0.4.3
    * @dxheroes/mcp-gemini-deep-research bumped to 0.4.3
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.3

## [0.6.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.5.1...backend-v0.6.0) (2026-01-16)


### Features

* **profiles:** allow deletion of default profile without re-seeding ([c20ab13](https://github.com/DXHeroes/local-mcp-gateway/commit/c20ab137bb58ed29861336c5e0835a4f20c0d5d2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.4.2
    * @dxheroes/local-mcp-database bumped to 0.4.2
    * @dxheroes/mcp-gemini-deep-research bumped to 0.4.2
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.2

## [0.5.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.5.0...backend-v0.5.1) (2026-01-16)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.4.1
    * @dxheroes/local-mcp-database bumped to 0.4.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.4.1
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.1

## [0.5.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.4.1...backend-v0.5.0) (2026-01-16)


### Features

* add docs page, AGENTS.md files, and UI improvements ([d24105b](https://github.com/DXHeroes/local-mcp-gateway/commit/d24105bf5face12348b5617f0deb6fba52778ca1))
* add gateway settings and upgrade to Streamable HTTP transport ([ba22c9f](https://github.com/DXHeroes/local-mcp-gateway/commit/ba22c9f033071e43a50462280233a0bb1ad34ed7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.4.0
    * @dxheroes/local-mcp-database bumped to 0.4.0
    * @dxheroes/mcp-gemini-deep-research bumped to 0.4.0
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.4.0

## [0.4.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.4.0...backend-v0.4.1) (2026-01-14)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.3.4
    * @dxheroes/local-mcp-database bumped to 0.3.4
    * @dxheroes/mcp-gemini-deep-research bumped to 0.3.4
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.3.4

## [0.4.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.3.2...backend-v0.4.0) (2026-01-14)


### Features

* add logging configuration and NGINX settings ([2efd142](https://github.com/DXHeroes/local-mcp-gateway/commit/2efd1427135948ccb62daecee29547a6e8982490))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.3.3
    * @dxheroes/local-mcp-database bumped to 0.3.3
    * @dxheroes/mcp-gemini-deep-research bumped to 0.3.3
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.3.3

## [0.3.2](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.3.1...backend-v0.3.2) (2026-01-13)


### Bug Fixes

* simplify tool inclusion logic in ProxyService ([8bb3be9](https://github.com/DXHeroes/local-mcp-gateway/commit/8bb3be93ef5504790edef84711cc3cff8c4dc6d9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.3.2
    * @dxheroes/local-mcp-database bumped to 0.3.2
    * @dxheroes/mcp-gemini-deep-research bumped to 0.3.2
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.3.2

## [0.3.1](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.3.0...backend-v0.3.1) (2026-01-13)


### Bug Fixes

* update package names in Dockerfiles and add apps to npm publish ([1928dba](https://github.com/DXHeroes/local-mcp-gateway/commit/1928dba89a6a9134fdadf5bcacd3a0617cee74dc))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.3.1
    * @dxheroes/local-mcp-database bumped to 0.3.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.3.1
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.3.1

## [0.3.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.2.0...backend-v0.3.0) (2026-01-13)


### Miscellaneous

* release 0.3.0 ([9d54f73](https://github.com/DXHeroes/local-mcp-gateway/commit/9d54f73a2d4cd49903ad353e131740513915d681))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.3.0
    * @dxheroes/local-mcp-database bumped to 0.3.0
    * @dxheroes/mcp-gemini-deep-research bumped to 0.3.0
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.3.0

## [0.2.0](https://github.com/DXHeroes/local-mcp-gateway/compare/backend-v0.2.0...backend-v0.2.0) (2026-01-13)


### Features

* initial release v0.2.0 ([35645f8](https://github.com/DXHeroes/local-mcp-gateway/commit/35645f81a4f291ae4b3e9f68657cd96db41b8a16))


### Bug Fixes

* add GET handler for MCP endpoint to return usage info instead of 404 ([d7273bb](https://github.com/DXHeroes/local-mcp-gateway/commit/d7273bbc66c18f0d30690483b10f41bc6382863c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-core bumped to 0.2.1
    * @dxheroes/local-mcp-database bumped to 0.2.1
    * @dxheroes/mcp-gemini-deep-research bumped to 0.2.1
  * devDependencies
    * @dxheroes/local-mcp-config bumped to 0.2.1
