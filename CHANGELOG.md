# Changelog

## [0.9.0](https://github.com/DXHeroes/local-mcp-gateway/compare/v0.8.0...v0.9.0) (2026-01-16)


### Features

* add docs page, AGENTS.md files, and UI improvements ([d24105b](https://github.com/DXHeroes/local-mcp-gateway/commit/d24105bf5face12348b5617f0deb6fba52778ca1))
* add gateway settings and upgrade to Streamable HTTP transport ([ba22c9f](https://github.com/DXHeroes/local-mcp-gateway/commit/ba22c9f033071e43a50462280233a0bb1ad34ed7))
* add logging configuration and NGINX settings ([2efd142](https://github.com/DXHeroes/local-mcp-gateway/commit/2efd1427135948ccb62daecee29547a6e8982490))
* allow profile name editing with URL change warning ([6656c6e](https://github.com/DXHeroes/local-mcp-gateway/commit/6656c6e597bcdb457135a52a71b0c24066fed5ef))
* convert AI prompts to tabbed interface and remove input_schema ([60b46b5](https://github.com/DXHeroes/local-mcp-gateway/commit/60b46b5a5130af982a6a91d9b889a2297203a176))
* initial release v0.2.0 ([35645f8](https://github.com/DXHeroes/local-mcp-gateway/commit/35645f81a4f291ae4b3e9f68657cd96db41b8a16))
* **profiles:** allow deletion of default profile without re-seeding ([c20ab13](https://github.com/DXHeroes/local-mcp-gateway/commit/c20ab137bb58ed29861336c5e0835a4f20c0d5d2))
* **release:** unify package versions with linked-versions plugin ([a3dc005](https://github.com/DXHeroes/local-mcp-gateway/commit/a3dc00553571675baa07ea5b16be41d20bf7cbf6))
* **ui:** add toast color variants with consistent styling ([a3a8e32](https://github.com/DXHeroes/local-mcp-gateway/commit/a3a8e3216b5f5a5b49d43d5a29b3b81f27ba69d1))
* update CORS and API endpoint configurations ([c997b1c](https://github.com/DXHeroes/local-mcp-gateway/commit/c997b1c88d6297bac96aca071eef3c237c7e6da5))


### Bug Fixes

* add GET handler for MCP endpoint to return usage info instead of 404 ([d7273bb](https://github.com/DXHeroes/local-mcp-gateway/commit/d7273bbc66c18f0d30690483b10f41bc6382863c))
* enhance API key configuration handling in McpServerForm ([849c740](https://github.com/DXHeroes/local-mcp-gateway/commit/849c7409f39dc39ac2b542c51888c1866fc4fc3c))
* **release:** add merge: false to node-workspace plugin ([5a7f7e1](https://github.com/DXHeroes/local-mcp-gateway/commit/5a7f7e1e584f55dff5fa2be5de326fc7584b4a7d))
* **release:** configure linked-versions with root entry for unified changelog ([24bb9f2](https://github.com/DXHeroes/local-mcp-gateway/commit/24bb9f27f6ca7aaab9451c9cd66f3f9c5671d2f2))
* **release:** remove node-workspace plugin and add separate-pull-requests false ([a2ddcb5](https://github.com/DXHeroes/local-mcp-gateway/commit/a2ddcb561fe6c45ae063a93b5e43c88dbda68a06))
* simplify tool inclusion logic in ProxyService ([8bb3be9](https://github.com/DXHeroes/local-mcp-gateway/commit/8bb3be93ef5504790edef84711cc3cff8c4dc6d9))
* update API URL handling and configure Nginx for backend proxy ([8357f3b](https://github.com/DXHeroes/local-mcp-gateway/commit/8357f3bbc6a643b2ca56bd0d3113b5d166427177))
* update package names in Dockerfiles and add apps to npm publish ([1928dba](https://github.com/DXHeroes/local-mcp-gateway/commit/1928dba89a6a9134fdadf5bcacd3a0617cee74dc))
* update server ID handling in ProfileForm and ProfilesPage ([faf2985](https://github.com/DXHeroes/local-mcp-gateway/commit/faf29859585d2a6af6fbaeeeb773fad09c48d502))
* update tests to match new UI components ([8f79066](https://github.com/DXHeroes/local-mcp-gateway/commit/8f79066a3ff0a5e912e13a5f8bfa1f8e6d8935b4))


### Documentation

* add dashboard preview image ([f4756bd](https://github.com/DXHeroes/local-mcp-gateway/commit/f4756bdee833d7f77602c350f0ea0f21ee058c40))
* add mpc_gateway configuration to README ([354c88a](https://github.com/DXHeroes/local-mcp-gateway/commit/354c88a46637be1cb946043c68abc2b3eff63eed))
* clarify default gateway API endpoint usage in README ([d25c499](https://github.com/DXHeroes/local-mcp-gateway/commit/d25c499c45543cea0b11c4c02a9bed0c6d689981))
* enhance MCP server configuration section in README ([1d7edfd](https://github.com/DXHeroes/local-mcp-gateway/commit/1d7edfde685e5460378439427714c38e03e05014))
* enhance README with additional configuration steps and images ([1266090](https://github.com/DXHeroes/local-mcp-gateway/commit/12660909aecd55bbaed712014c4a9dd7347bacec))
* format curl command in README for better readability ([5f6620b](https://github.com/DXHeroes/local-mcp-gateway/commit/5f6620bbacc01808dc743e255e18eb73bbc50d1c))
* update dashboard preview image in README ([aafc084](https://github.com/DXHeroes/local-mcp-gateway/commit/aafc0845811c9357ccf1a7fb359edf453c746488))
* update README to consolidate and enhance Docker quick start instructions ([3f48be5](https://github.com/DXHeroes/local-mcp-gateway/commit/3f48be5f278da1f7cdef1f7e94caf2676ed8375b))
* update README to include default gateway API usage instructions ([531e7eb](https://github.com/DXHeroes/local-mcp-gateway/commit/531e7ebff2ca3b99e28575aad02e93379ea40e70))
* update README to reflect new Middleware Layer functionality ([67a3572](https://github.com/DXHeroes/local-mcp-gateway/commit/67a357252d692c5335cd9a5fdd8404f51a8d7bb8))
* update README with Docker command enhancement ([6231ec1](https://github.com/DXHeroes/local-mcp-gateway/commit/6231ec182f266fb1f5a8df75b4f504e19ca4ad19))


### Miscellaneous

* release 0.3.0 ([9d54f73](https://github.com/DXHeroes/local-mcp-gateway/commit/9d54f73a2d4cd49903ad353e131740513915d681))
