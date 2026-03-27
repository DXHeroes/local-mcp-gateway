# Changelog

## [0.17.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.16.0...frontend-v0.17.0) (2026-03-27)


### Features

* **auth:** implement email/password signup modes and validation ([a772b51](https://github.com/DXHeroes/local-mcp-gateway/commit/a772b51acd00255ba7fb4c316e00ad49374c9b62))
* **debug:** implement summary endpoint and enhance debug logs overview ([675650a](https://github.com/DXHeroes/local-mcp-gateway/commit/675650a47260401b4cf07daefabe4ff5e06349b3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.17
    * @dxheroes/local-mcp-ui bumped to 0.5.15

## [0.16.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.15.1...frontend-v0.16.0) (2026-03-18)


### Features

* **debug:** enhance logging retrieval with pagination and filtering support ([815f268](https://github.com/DXHeroes/local-mcp-gateway/commit/815f2686f1ec44ee81bd6455509254fea21cf8c1))
* **logging:** implement structured logging and error handling across services ([5de103a](https://github.com/DXHeroes/local-mcp-gateway/commit/5de103a22bf25a7780437e89e67b6526d2b5b894))
* **profiles:** implement getInfo method for profile aggregation ([1a8efb4](https://github.com/DXHeroes/local-mcp-gateway/commit/1a8efb4bd3e199ee9355646850ca86179f39f6a7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.16
    * @dxheroes/local-mcp-ui bumped to 0.5.14

## [0.15.1](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.15.0...frontend-v0.15.1) (2026-03-18)


### Bug Fixes

* **mcp:** refine preset handling for API key configuration ([fae955e](https://github.com/DXHeroes/local-mcp-gateway/commit/fae955ec6ee846d095cf8508611ea0dbbf54b302))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.15
    * @dxheroes/local-mcp-ui bumped to 0.5.13

## [0.15.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.14.0...frontend-v0.15.0) (2026-03-16)


### Features

* **mcp:** implement server-level tool configuration management ([f8a1f58](https://github.com/DXHeroes/local-mcp-gateway/commit/f8a1f58d28c4da9a8a05034b1665ba2f58338d01))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.14
    * @dxheroes/local-mcp-ui bumped to 0.5.12

## [0.14.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.13.0...frontend-v0.14.0) (2026-03-16)


### Features

* **auth:** improve user organization handling during signup ([8447d08](https://github.com/DXHeroes/local-mcp-gateway/commit/8447d08e55274973e33d97fcc3b66a269b96be51))
* **docs:** enhance documentation and user onboarding experience ([27adcf5](https://github.com/DXHeroes/local-mcp-gateway/commit/27adcf58b55926406fdc2a926a61ccfb92fad798))
* **invitation:** implement organization invitation acceptance flow ([c3731c2](https://github.com/DXHeroes/local-mcp-gateway/commit/c3731c2e0ced853fa37868b9f560edb4bf0cff2f))
* **mcp:** enrich server creation with metadata and enhance documentation ([fb3d901](https://github.com/DXHeroes/local-mcp-gateway/commit/fb3d901d4ab97308732dbdb15218ec9968cf56c9))
* **mcp:** streamline MCP presets and enhance server configuration ([9eb1f2c](https://github.com/DXHeroes/local-mcp-gateway/commit/9eb1f2c17ae8dea5d7d8035474adcfde9da56474))
* **organization-domains:** add auto-join domain management for organizations ([2e5071d](https://github.com/DXHeroes/local-mcp-gateway/commit/2e5071d82811725df5ef1729cc2f657d11fade14))
* **organization-domains:** implement blacklisted domains for auto-join prevention ([5226d48](https://github.com/DXHeroes/local-mcp-gateway/commit/5226d481b94b6fd192cfe46e385143b0f642a4d5))
* **organizations:** add role management for organization members ([24d9337](https://github.com/DXHeroes/local-mcp-gateway/commit/24d9337f1a9a321706d8c7f66b9268b53d60e583))
* **tests:** enhance integration tests for MCP services and sharing functionality ([d4550ba](https://github.com/DXHeroes/local-mcp-gateway/commit/d4550baefb3e623500e444cb6cbcfd911b88fefb))


### Bug Fixes

* **OrgGate:** improve organization handling by ensuring first organization is valid ([a811405](https://github.com/DXHeroes/local-mcp-gateway/commit/a811405b21ce2bc58fad95deae1e8d1d9fd00e89))


### Code Refactoring

* **api:** remove getAuthBaseUrl and update auth client to use getFullMcpEndpointUrl ([e4ab155](https://github.com/DXHeroes/local-mcp-gateway/commit/e4ab155531445ff4836813a98afa59ff314736ef))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.13
    * @dxheroes/local-mcp-ui bumped to 0.5.11

## [0.13.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.12.0...frontend-v0.13.0) (2026-03-16)


### Features

* **api:** implement apiFetch utility and refactor API calls across components ([e55d18d](https://github.com/DXHeroes/local-mcp-gateway/commit/e55d18df85ede8090584a5ef51b2e9544eb3bb65))
* **auth:** enable toggle for email and password authentication ([a0c1dd0](https://github.com/DXHeroes/local-mcp-gateway/commit/a0c1dd0a192ffd4199af2bb00d9e83f1c526be5c))
* **config:** add runtime API URL configuration and update frontend components ([66ca7e4](https://github.com/DXHeroes/local-mcp-gateway/commit/66ca7e48c5dd1dd71ad528df5a7f264d200bbc7e))
* **docker:** enhance frontend configuration for production and local development ([86ab349](https://github.com/DXHeroes/local-mcp-gateway/commit/86ab349564ad8c90319d13540b041e74fffee566))
* **seo:** enhance SEO and session handling across frontend and backend ([2178043](https://github.com/DXHeroes/local-mcp-gateway/commit/21780436a9e93da63e3c6cec8318b4f8d1a6dbf6))
* **tests:** enhance E2E testing setup and add API integration tests ([1b6668e](https://github.com/DXHeroes/local-mcp-gateway/commit/1b6668e48bf18ae112c6dfa3b3edf8dddbecca7a))


### Bug Fixes

* **docker:** make frontend API calls relative for Coolify reverse proxy ([a4343db](https://github.com/DXHeroes/local-mcp-gateway/commit/a4343db7b1f50133d0a3779210d29d2c25c127d3))


### Code Refactoring

* **docker:** improve NGINX configuration handling in Dockerfile ([cf15589](https://github.com/DXHeroes/local-mcp-gateway/commit/cf155895c598147483e585e28d59e3ffa48aef56))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.12
    * @dxheroes/local-mcp-ui bumped to 0.5.10

## [0.12.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.11.0...frontend-v0.12.0) (2026-03-12)


### Features

* **auth:** implement MCP OAuth guard and enhance authentication flow ([14f6355](https://github.com/DXHeroes/local-mcp-gateway/commit/14f6355b7e3e1d2a2a757643c7bc1946aa1e09cd))
* enhance OAuth integration and add custom headers support for MCP servers ([0904743](https://github.com/DXHeroes/local-mcp-gateway/commit/09047436072810f5876a2c92ba47f6f90f8f6103))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.11
    * @dxheroes/local-mcp-ui bumped to 0.5.9

## [0.11.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.10.1...frontend-v0.11.0) (2026-03-11)


### Features

* implement OrgGate for organization management and enhance Layout with organization selector ([69c96f3](https://github.com/DXHeroes/local-mcp-gateway/commit/69c96f37e13e704254fdc6d146b61dbbcab7723c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.10
    * @dxheroes/local-mcp-ui bumped to 0.5.8

## [0.10.1](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.10.0...frontend-v0.10.1) (2026-03-11)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.9
    * @dxheroes/local-mcp-ui bumped to 0.5.7

## [0.10.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.9.2...frontend-v0.10.0) (2026-03-10)


### Features

* add mandatory org context, Better Auth, and MCP preset gallery ([18ddf94](https://github.com/DXHeroes/local-mcp-gateway/commit/18ddf94d5269a9b77e9e251b96b6fc56bd496ad1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.8
    * @dxheroes/local-mcp-ui bumped to 0.5.6

## [0.9.2](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.9.1...frontend-v0.9.2) (2026-03-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.7
    * @dxheroes/local-mcp-ui bumped to 0.5.5

## [0.9.1](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.9.0...frontend-v0.9.1) (2026-03-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.6
    * @dxheroes/local-mcp-ui bumped to 0.5.4

## [0.9.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.8.2...frontend-v0.9.0) (2026-03-09)


### Features

* **mcp:** introduce external MCP server support and enhance seeding functionality ([9f99183](https://github.com/DXHeroes/local-mcp-gateway/commit/9f99183d02c42a572bc82c7c599822d4feb4a4b8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.5
    * @dxheroes/local-mcp-ui bumped to 0.5.3

## [0.8.2](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.8.1...frontend-v0.8.2) (2026-02-02)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.4
    * @dxheroes/local-mcp-ui bumped to 0.5.2

## [0.8.1](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.8.0...frontend-v0.8.1) (2026-01-16)


### Bug Fixes

* resolve biome formatting issues in toast and profiles ([673e8d2](https://github.com/DXHeroes/local-mcp-gateway/commit/673e8d2b388208022fc4cde809725c3fcd130664))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.3
    * @dxheroes/local-mcp-ui bumped to 0.5.1

## [0.8.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.7.0...frontend-v0.8.0) (2026-01-16)


### Features

* **ui:** add toast color variants with consistent styling ([a3a8e32](https://github.com/DXHeroes/local-mcp-gateway/commit/a3a8e3216b5f5a5b49d43d5a29b3b81f27ba69d1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.2
    * @dxheroes/local-mcp-ui bumped to 0.5.0

## [0.7.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.6.0...frontend-v0.7.0) (2026-01-16)


### Features

* allow profile name editing with URL change warning ([6656c6e](https://github.com/DXHeroes/local-mcp-gateway/commit/6656c6e597bcdb457135a52a71b0c24066fed5ef))


### Bug Fixes

* update tests to match new UI components ([8f79066](https://github.com/DXHeroes/local-mcp-gateway/commit/8f79066a3ff0a5e912e13a5f8bfa1f8e6d8935b4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.1
    * @dxheroes/local-mcp-ui bumped to 0.4.1

## [0.6.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.5.0...frontend-v0.6.0) (2026-01-16)


### Features

* add docs page, AGENTS.md files, and UI improvements ([d24105b](https://github.com/DXHeroes/local-mcp-gateway/commit/d24105bf5face12348b5617f0deb6fba52778ca1))
* add gateway settings and upgrade to Streamable HTTP transport ([ba22c9f](https://github.com/DXHeroes/local-mcp-gateway/commit/ba22c9f033071e43a50462280233a0bb1ad34ed7))
* convert AI prompts to tabbed interface and remove input_schema ([60b46b5](https://github.com/DXHeroes/local-mcp-gateway/commit/60b46b5a5130af982a6a91d9b889a2297203a176))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.4.0
    * @dxheroes/local-mcp-ui bumped to 0.4.0

## [0.5.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.4.0...frontend-v0.5.0) (2026-01-14)


### Features

* update CORS and API endpoint configurations ([c997b1c](https://github.com/DXHeroes/local-mcp-gateway/commit/c997b1c88d6297bac96aca071eef3c237c7e6da5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.3.4
    * @dxheroes/local-mcp-ui bumped to 0.3.4

## [0.4.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.3.2...frontend-v0.4.0) (2026-01-14)


### Features

* add logging configuration and NGINX settings ([2efd142](https://github.com/DXHeroes/local-mcp-gateway/commit/2efd1427135948ccb62daecee29547a6e8982490))


### Bug Fixes

* enhance API key configuration handling in McpServerForm ([849c740](https://github.com/DXHeroes/local-mcp-gateway/commit/849c7409f39dc39ac2b542c51888c1866fc4fc3c))
* update server ID handling in ProfileForm and ProfilesPage ([faf2985](https://github.com/DXHeroes/local-mcp-gateway/commit/faf29859585d2a6af6fbaeeeb773fad09c48d502))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.3.3
    * @dxheroes/local-mcp-ui bumped to 0.3.3

## [0.3.2](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.3.1...frontend-v0.3.2) (2026-01-13)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.3.2
    * @dxheroes/local-mcp-ui bumped to 0.3.2

## [0.3.1](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.3.0...frontend-v0.3.1) (2026-01-13)


### Bug Fixes

* update package names in Dockerfiles and add apps to npm publish ([1928dba](https://github.com/DXHeroes/local-mcp-gateway/commit/1928dba89a6a9134fdadf5bcacd3a0617cee74dc))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.3.1
    * @dxheroes/local-mcp-ui bumped to 0.3.1

## [0.3.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.2.0...frontend-v0.3.0) (2026-01-13)


### Miscellaneous

* release 0.3.0 ([9d54f73](https://github.com/DXHeroes/local-mcp-gateway/commit/9d54f73a2d4cd49903ad353e131740513915d681))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.3.0
    * @dxheroes/local-mcp-ui bumped to 0.3.0

## [0.2.0](https://github.com/DXHeroes/local-mcp-gateway/compare/frontend-v0.2.0...frontend-v0.2.0) (2026-01-13)


### Features

* initial release v0.2.0 ([35645f8](https://github.com/DXHeroes/local-mcp-gateway/commit/35645f81a4f291ae4b3e9f68657cd96db41b8a16))


### Bug Fixes

* update API URL handling and configure Nginx for backend proxy ([8357f3b](https://github.com/DXHeroes/local-mcp-gateway/commit/8357f3bbc6a643b2ca56bd0d3113b5d166427177))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @dxheroes/local-mcp-config bumped to 0.2.1
    * @dxheroes/local-mcp-ui bumped to 0.2.1
