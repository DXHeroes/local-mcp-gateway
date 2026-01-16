# Public Directory

## Description

Static assets served directly by Vite without processing. Files are accessible at root URL.

## Contents

- `favicon-dev.svg` - Favicon for development environment
- `favicon-docker.svg` - Favicon for Docker/production environment

## Key Concepts

- **Static Assets**: Files served as-is without bundling
- **Root Access**: `public/favicon.svg` → `/favicon.svg`
- **Environment Favicons**: Different favicons help identify environment
- **Vite Behavior**: Files are copied to dist on build
