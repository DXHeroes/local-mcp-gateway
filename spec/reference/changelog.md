# Changelog

All notable changes to Local MCP Gateway.

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.

Types of changes:
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

---

## [Unreleased]

### Added
- Initial documentation structure
- User guide with getting started tutorials
- Technical documentation for all components
- Use case examples and integration guides

### Changed
- Documentation improvements

---

## [0.1.0] - Initial Release

### Added

#### Core Features
- Profile management system
  - Create, read, update, delete profiles
  - Unique slug-based endpoints per profile
  - Profile-server relationships

- MCP Server support
  - Remote HTTP servers
  - Remote SSE servers
  - External stdio servers
  - Custom TypeScript modules

- OAuth 2.1 authentication
  - PKCE security for all flows
  - Token encryption at rest
  - Automatic token refresh
  - Dynamic Client Registration (DCR)

- API Key authentication
  - Secure storage
  - Custom header configuration

#### Web Interface
- Profiles management page
- MCP Servers management page
- Server detail view with tools list
- Debug logs viewer with real-time updates

#### API
- REST API for management operations
- MCP proxy endpoints per profile
- OAuth flow endpoints
- Debug log endpoints

#### Developer Experience
- Monorepo structure with Turborepo
- TypeScript throughout
- Shared UI component library
- Comprehensive type definitions

### Technical Details
- Express.js backend
- React 19 frontend with Vite
- SQLite database with Drizzle ORM
- TailwindCSS styling

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | TBD | Initial release |

---

## Upgrade Guide

### From Pre-release to 0.1.0

No migration needed - fresh install recommended for pre-release users.

### Future Upgrades

Check this section for upgrade instructions when new versions are released.

---

## Deprecation Notices

No deprecations at this time.

---

## See Also

- [FAQ](./faq.md) - Frequently asked questions
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Contributing](../contributing/README.md) - How to contribute
