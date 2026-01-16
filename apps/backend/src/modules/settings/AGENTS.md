# Settings Module

## Description

Application settings module. Manages gateway-wide configuration stored in the database.

## Contents

- `settings.module.ts` - Module definition
- `settings.controller.ts` - REST API for settings
- `settings.service.ts` - Settings storage and retrieval
- `settings.constants.ts` - Default settings values

## Key Endpoints

- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/:key` - Get single setting

## Key Settings

- `mcpTransport` - Default MCP transport type (http/sse)
- `debugLogRetention` - Debug log retention period
- Other gateway-wide configuration

## Key Concepts

- **Key-Value Storage**: Settings stored as key-value pairs
- **Defaults**: Default values defined in constants
- **Persistence**: Settings persist across restarts
- **Type Safety**: Settings validated against expected types
