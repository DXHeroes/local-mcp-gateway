# Apps Directory

## Purpose

This directory contains the main applications: backend (Express.js) and frontend (React).

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Structure

```
apps/
├── backend/                 # Express.js backend
└── frontend/                # React frontend
```

## Child Directories

- **[backend/AGENTS.md](backend/AGENTS.md)** - Backend application
- **[frontend/AGENTS.md](frontend/AGENTS.md)** - Frontend application

## Development Rules

- Each app has its own `package.json` and `tsconfig.json`
- Apps depend on packages using workspace protocol
- Hot-reload enabled in dev mode
- Tests required before implementation (TDD)
- Coverage: ≥90%

## Running Applications

- `pnpm dev` from root runs both apps
- `pnpm dev:backend` - Backend only
- `pnpm dev:frontend` - Frontend only

