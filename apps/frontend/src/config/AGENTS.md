# Config Directory

## Description

Frontend configuration including API client setup and environment detection.

## Contents

- `api.ts` - TanStack Query API hooks and fetch utilities

## Key Concepts

- **API Client**: Typed API hooks using TanStack Query
- **Environment Detection**: Auto-detects dev (port 3000) vs Docker (port 9630)
- **Base URL**: Dynamically sets API base URL based on environment
- **Type Safety**: All API calls are fully typed
