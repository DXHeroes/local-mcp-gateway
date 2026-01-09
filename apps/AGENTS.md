# Apps Directory

## Purpose

Main applications: **NestJS backend** and **React frontend**.

**NOTE:** No user authentication - all features are immediately accessible.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Structure

```
apps/
├── backend/                 # NestJS backend (API + MCP proxy)
└── frontend/                # React 19 frontend (Web UI)
```

## Child Directories

- **[backend/AGENTS.md](backend/AGENTS.md)** - NestJS backend application
- **[frontend/AGENTS.md](frontend/AGENTS.md)** - React frontend application

## Technology Stack

### Backend
- **Framework**: NestJS 11.x
- **Database**: Prisma ORM with SQLite
- **MCP Discovery**: Auto-discovers packages from `mcp-servers/`

### Frontend
- **Framework**: React 19 with Vite
- **State**: TanStack Query + Zustand
- **Styling**: Tailwind CSS v4

## Running Applications

```bash
# Both apps (development)
pnpm dev

# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend
```

## Ports

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173
