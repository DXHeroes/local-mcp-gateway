<!-- ece204be-39c2-45ca-881b-db3f4363da02 20406f70-ff65-426a-90fe-6c22a3de7e2f -->
# Lokální MCP Proxy Server - Detailní plán

## Přehled architektury

Aplikace bude monorepo struktura s backendem (Express.js) a frontendem (React + Vite). Backend bude fungovat jako proxy MCP server, který směruje požadavky na externí MCP servery nebo vlastní implementace. Každý profil bude mít vlastní HTTP endpoint pro použití v lokálních aplikacích.

## Technologický stack

### Backend

- **Express.js** (nejnovější verze) - HTTP server pro MCP proxy endpointy
- **TypeScript** (5.6+) - silné typování celé aplikace
- **SQLite** (better-sqlite3, nejnovější verze) - databáze pro profily a debug logy
- **@modelcontextprotocol/sdk** (nejnovější verze) - oficiální MCP SDK pro TypeScript
- **zod** (nejnovější verze) - runtime validace a typování
- **winston** (nejnovější verze) - strukturované logování
- **oauth4webapi** nebo **openid-client** (nejnovější verze) - OAuth 2.1 implementace podle MCP standardu
- **crypto** (built-in Node.js) - PKCE generování pro OAuth 2.1

### Frontend

- **React 19** - UI framework (nejnovější verze)
- **Vite** (nejnovější verze) - build tool a dev server
- **TypeScript** (5.6+) - typování frontendu
- **TailwindCSS** (nejnovější verze) - utility-first CSS
- **shadcn-ui** (nejnovější verze) - UI komponenty
- **TanStack Query** (v5, nejnovější verze) - data fetching a caching
- **React Router** (v7, nejnovější verze) - routing
- **zustand** (nejnovější verze) - state management

### Nástroje

- **pnpm** (nejnovější verze) - package manager
- **Turborepo** (nejnovější verze) - monorepo build system a task runner
- **Biome** (nejnovější verze) - linting a formátování
- **Rollup.js** (nejnovější verze) - bundling pro vlastní MCP moduly
- **tsx** (nejnovější verze) - TypeScript execution pro dev
- **Docker** - kontejnerizace aplikace
- **Docker Compose** - orchestrace multi-container aplikace

### Dokumentace

- **TypeDoc** (nejnovější verze) - automatická generace API dokumentace z TypeScript komentářů
- **Markdown** - všechny dokumentační soubory
- **Mermaid** - diagramy v dokumentaci (architektura, flows)
- **Swagger/OpenAPI** (volitelné) - API dokumentace pro REST endpointy

### Testování

- **Playwright** (nejnovější verze) - E2E testování
- **Vitest** (nejnovější verze) - unit a integration testy (kompatibilní s Vite)
- **@testing-library/react** (nejnovější verze) - React component testy
- **@testing-library/jest-dom** - DOM assertions
- **supertest** (nejnovější verze) - HTTP assertion pro API testy
- **c8** nebo **vitest coverage** - code coverage reporting
- **MSW (Mock Service Worker)** (nejnovější verze) - API mocking pro testy

## Databázové schéma (SQLite)

### Tabulka: profiles

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Tabulka: profile_mcp_servers

```sql
CREATE TABLE profile_mcp_servers (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1
);
```

### Tabulka: mcp_servers

```sql
CREATE TABLE mcp_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'external' | 'custom' | 'remote_http' | 'remote_sse'
  config TEXT NOT NULL, -- JSON: 
  --   external: { command, args, env }
  --   custom: { modulePath }
  --   remote_http: { url, transport: 'http' }
  --   remote_sse: { url, transport: 'sse' }
  oauth_config TEXT, -- JSON: { authorizationServerUrl, resource, scopes, requiresOAuth: boolean } pro OAuth 2.1
  api_key_config TEXT, -- JSON: { apiKey, headerName: 'Authorization' | 'X-API-Key' | custom, headerValue: 'Bearer {apiKey}' | '{apiKey}' }
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Tabulka: oauth_tokens

```sql
CREATE TABLE oauth_tokens (
  id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at INTEGER, -- Unix timestamp, nullable pro tokens bez expirace
  scope TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Tabulka: oauth_client_registrations

```sql
CREATE TABLE oauth_client_registrations (
  id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  authorization_server_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT, -- nullable pro public clients
  registration_access_token TEXT, -- pro Dynamic Client Registration
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(mcp_server_id, authorization_server_url)
);
```

### Tabulka: migrations

```sql
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at INTEGER NOT NULL
);
```

### Tabulka: debug_logs

```sql
CREATE TABLE debug_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mcp_server_id TEXT REFERENCES mcp_servers(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL, -- 'tools/call', 'resources/read', etc.
  request_payload TEXT NOT NULL, -- JSON
  response_payload TEXT, -- JSON, nullable pro pending requests
  status TEXT NOT NULL, -- 'pending' | 'success' | 'error'
  error_message TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);
```

## Struktura projektu

```
local_mcp_ui/
├── packages/
│   ├── core/                    # Core abstrakce a typy
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── mcp.ts      # MCP typy a rozhraní
│   │   │   │   ├── profile.ts  # Profil typy
│   │   │   │   └── database.ts # DB typy
│   │   │   ├── abstractions/
│   │   │   │   ├── McpServer.ts      # Abstraktní třída pro MCP servery
│   │   │   │   ├── ProxyHandler.ts   # Proxy logika
│   │   │   │   ├── ProfileManager.ts # Správa profilů
│   │   │   │   └── OAuthManager.ts   # OAuth 2.1 flow management
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                # SQLite databáze vrstva
│   │   ├── src/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_schema.ts
│   │   │   │   ├── 002_add_oauth_support.ts
│   │   │   │   └── migration-runner.ts
│   │   │   ├── seeds/
│   │   │   │   ├── default-profiles.ts
│   │   │   │   ├── example-mcp-servers.ts
│   │   │   │   └── seed-runner.ts
│   │   │   ├── repositories/
│   │   │   │   ├── ProfileRepository.ts
│   │   │   │   ├── McpServerRepository.ts
│   │   │   │   ├── DebugLogRepository.ts
│   │   │   │   ├── OAuthTokenRepository.ts
│   │   │   │   └── OAuthClientRegistrationRepository.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── custom-mcp-loader/       # Dynamický loader pro vlastní MCP
│       ├── src/
│       │   ├── ModuleLoader.ts
│       │   ├── Validator.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── backend/                 # Express.js backend
│   │   ├── src/
│   │   │   ├── server.ts       # Express server setup
│   │   │   ├── routes/
│   │   │   │   ├── profiles.ts
│   │   │   │   ├── mcp-servers.ts
│   │   │   │   ├── debug.ts
│   │   │   │   ├── proxy.ts    # MCP proxy endpointy
│   │   │   │   └── oauth.ts    # OAuth 2.1 callback a token management
│   │   │   ├── handlers/
│   │   │   │   ├── McpProxyHandler.ts
│   │   │   │   ├── ProfileHandler.ts
│   │   │   │   └── OAuthHandler.ts  # OAuth 2.1 flow handling
│   │   │   ├── middleware/
│   │   │   │   ├── debug-logger.ts
│   │   │   │   └── error-handler.ts
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── fixtures/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Profiles.tsx
│       │   │   ├── McpServers.tsx
│       │   │   ├── CustomMcp.tsx
│       │   │   └── DebugLogs.tsx
│       │   ├── components/
│       │   │   ├── ui/          # shadcn-ui komponenty
│       │   │   └── ...
│       │   ├── lib/
│       │   │   ├── api.ts       # API client
│       │   │   └── utils.ts
│       │   └── main.tsx
│       ├── __tests__/
│       │   ├── unit/
│       │   └── integration/
│       ├── e2e/
│       │   ├── profiles.spec.ts
│       │   ├── mcp-servers.spec.ts
│       │   ├── oauth-flow.spec.ts
│       │   └── custom-mcp.spec.ts
│       ├── Dockerfile
│       ├── package.json
│       ├── vite.config.ts
│       └── nginx.conf           # Nginx config pro production
│
├── custom-mcps/                 # Uživatelské vlastní MCP servery (jednoduchá implementace)
│   └── example-mcp/
│       ├── index.ts            # Jednoduchá implementace bez nutnosti balíčku
│       ├── tools/
│       │   └── weather.ts
│       ├── resources/
│       │   └── config.ts
│       └── package.json        # Volitelné, pouze pokud chce uživatel publikovat
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml      # Multi-container setup
│
├── .dockerignore
├── pnpm-workspace.yaml
├── turbo.json                  # Turborepo konfigurace
├── package.json                # Root package.json s workspace scripts
├── biome.json
├── vitest.config.ts            # Vitest konfigurace (unit + integration)
├── playwright.config.ts        # Playwright konfigurace (E2E)
├── .env.example
├── docker-compose.yml          # Root docker-compose pro dev i prod
├── .github/
│   └── workflows/
│       └── test.yml            # CI/CD test pipeline
├── docs/
│   ├── getting-started/
│   │   ├── installation.md
│   │   ├── quick-start.md
│   │   └── first-profile.md
│   ├── guides/
│   │   ├── creating-profiles.md
│   │   ├── adding-mcp-servers.md
│   │   ├── oauth-setup.md
│   │   │   ├── linear.md
│   │   │   ├── github.md
│   │   │   └── custom.md
│   │   ├── api-keys.md
│   │   ├── custom-mcp.md
│   │   ├── docker-deployment.md
│   │   └── troubleshooting.md
│   ├── api/
│   │   ├── overview.md
│   │   ├── profiles.md
│   │   ├── mcp-servers.md
│   │   ├── oauth.md
│   │   ├── proxy-endpoints.md
│   │   └── debug-logs.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── mcp-proxy.md
│   │   ├── oauth-flow.md
│   │   └── database-schema.md
│   ├── development/
│   │   ├── setup.md
│   │   ├── tdd-workflow.md
│   │   ├── contributing.md
│   │   ├── code-style.md
│   │   └── testing.md
│   ├── examples/
│   │   ├── simple-mcp.md
│   │   ├── oauth-mcp.md
│   │   └── api-integration.md
│   └── diagrams/
│       ├── architecture.mmd
│       ├── oauth-flow.mmd
│       └── mcp-proxy-flow.mmd
├── README.md                   # Hlavní README s quick start
└── CONTRIBUTING.md             # Contributing guide
```

### Poznámka k struktuře packages

- **Výchozí MCP servery**: Implementují se přímo v `custom-mcps/` jako jednoduché TypeScript moduly bez nutnosti vytvářet samostatný package
- **Budoucí packages**: Pokud uživatel chce vytvořit publikovatelný MCP package, může vytvořit nový package v `packages/` (např. `packages/mcp-linear`, `packages/mcp-github`) s vlastním `package.json` a publishing konfigurací
- **Turborepo**: Spravuje build dependencies a caching mezi packages
- **pnpm workspace**: Umožňuje lokální odkazy mezi packages pomocí workspace protocol

## Architektura komunikace

### Diagram toku požadavku

```
┌─────────────────┐
│ Lokální aplikace│
│  (Cursor, etc.) │
└────────┬────────┘
         │ HTTP POST /api/proxy/{profileId}/mcp
         │ JSON-RPC request
         ▼
┌─────────────────────────────────────────┐
│      Express Backend                    │
│  ┌───────────────────────────────────┐  │
│  │   Proxy Router                    │  │
│  │   - Parse profile ID              │  │
│  │   - Load profile config           │  │
│  │   - Route to appropriate handler │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │   Profile Manager                  │  │
│  │   - Get MCP servers for profile   │  │
│  │   - Determine routing strategy    │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│      ┌───────┴───────┐                  │
│      │               │                   │
│      ▼               ▼                   │
│  ┌─────────┐   ┌──────────────┐        │
│  │ External│   │ Custom MCP   │        │
│  │ MCP     │   │ Loader        │        │
│  │ Proxy   │   │               │        │
│  └────┬────┘   └──────┬───────┘        │
│       │               │                 │
│       │ stdio/HTTP    │ In-process      │
│       │               │                 │
└───────┼───────────────┼─────────────────┘
        │               │
        ▼               ▼
  ┌─────────┐     ┌──────────┐
  │ External│     │ Custom   │
  │ MCP     │     │ MCP      │
  │ Server  │     │ Module   │
  └─────────┘     └──────────┘
```

## Implementační detaily

### 1. Core abstrakce (`packages/core`)

#### `McpServer` abstraktní třída

- Definuje rozhraní pro všechny MCP servery (externí i vlastní)
- Metody: `initialize()`, `listTools()`, `callTool()`, `listResources()`, `readResource()`
- Silné typování pomocí generiků

#### `ProxyHandler`

- Agreguje požadavky napříč MCP servery v profilu
- Implementuje merge strategie pro tools/resources
- Error handling a retry logika

#### `ProfileManager`

- CRUD operace pro profily
- Validace konfigurací
- URL generování pro profily

#### `OAuthManager`

- OAuth 2.1 flow implementace podle MCP standardu (2025-06-18)
- Dynamic Client Registration (DCR) podpora podle RFC 7591
- PKCE generování a validace (code_verifier, code_challenge)
- Resource parameter handling (RFC 8707) - explicitní specifikace target resource
- Protected Resource Metadata discovery (RFC 9728)
- Authorization Server Metadata discovery (RFC 8414)
- Token refresh logika
- Secure token storage (encrypted v SQLite)
- Token audience validation
- OAuth callback handling s redirect zpět do frontend UI

#### `ApiKeyManager`

- Secure storage API klíčů (encrypted v SQLite)
- Header injection podle konfigurace (Authorization, X-API-Key, custom)
- Template support pro header values (`Bearer {apiKey}`, `{apiKey}`, atd.)
- Validation API klíčů před uložením

### 2. Database vrstva (`packages/database`)

- Repository pattern pro všechny entity
- Migrační systém s verzováním a rollback podporou
- Seed systém pro onboarding s předpřipravenými daty
- Automatické spuštění migrací a seedů při prvním spuštění
- Connection pooling a transaction management
- Type-safe queries pomocí zod validace

### 3. Custom MCP Loader (`packages/custom-mcp-loader`)

- Dynamické načítání TypeScript modulů z `custom-mcps/`
- **Validace struktury pomocí zod schémat** - strict validation před načtením
- **Code security:**
  - Syntax validation před execution
  - Path traversal prevence (`../` blocking)
  - File type validation (pouze .ts, .js)
  - File size limits
- **Sandboxing pro bezpečnost:**
  - VM2 nebo worker threads isolation
  - Resource limits (CPU, memory, execution time)
  - Network access restrictions
  - File system access restrictions
  - No eval() nebo Function() konstruktor
  - Whitelist povolených imports
- Hot-reload v dev módu (s re-validation)

### 4. Backend (`apps/backend`)

#### MCP Proxy endpointy (per profil)

Každý profil má vlastní MCP endpointy pro použití v AI nástrojích (Cursor, Claude, atd.):

- `POST /api/mcp/:profileId` - **HTTP MCP endpoint pro profil** (JSON-RPC 2.0)
  - Použití: `https://localhost:3001/api/mcp/default-profile`
  - Podporuje batch requests
  - Automatické přidání OAuth tokenů nebo API klíčů do headers
  
- `GET /api/mcp/:profileId/sse` - **SSE MCP endpoint pro profil** (Server-Sent Events)
  - Použití: `https://localhost:3001/api/mcp/default-profile/sse`
  - Streamování pro real-time komunikaci
  - Podpora pro Linear SSE transport
  
- `GET /api/mcp/:profileId/info` - Metadata endpoint (tools, resources) pro profil
  - Vrací seznam všech tools a resources z MCP serverů v profilu
  - Použití pro discovery a debugging

**Implementace:**
- Agregace tools/resources ze všech MCP serverů v profilu
- Merge strategie pro duplicitní názvy
- Routing requestů na správný MCP server podle tool/resource názvu
- Fallback handling pokud MCP server není dostupný

**Příklad použití:**
- V Cursor: `https://localhost:3001/api/mcp/default-profile`
- V Claude: `https://localhost:3001/api/mcp/default-profile`
- SSE endpoint: `https://localhost:3001/api/mcp/default-profile/sse`

#### API endpointy

- `GET/POST/PUT/DELETE /api/profiles` - správa profilů
- `GET/POST/PUT/DELETE /api/mcp-servers` - správa MCP serverů
- `GET /api/debug/logs` - debug logy s filtrováním
- `GET /api/oauth/authorize/:mcpServerId` - iniciuje OAuth 2.1 flow (redirect na authorization server)
- `GET /api/oauth/callback` - OAuth callback endpoint (zpracuje authorization code, redirect zpět do UI)
- `POST /api/oauth/refresh/:mcpServerId` - refresh access token
- `GET /api/oauth/status/:mcpServerId` - status OAuth připojení
- `DELETE /api/oauth/revoke/:mcpServerId` - revoke a odstranění tokenů
- `POST /api/mcp-servers/:id/api-key` - nastavení API klíče pro MCP server (alternativa k OAuth)

#### Middleware

- **Request validation middleware** - zod validace všech requestů před zpracováním
- **Rate limiting middleware** - per-endpoint rate limits
- **CORS middleware** - restriktivní CORS policy
- **Security headers middleware** - všechny security headers
- **Input sanitization middleware** - sanitizace všech vstupů
- **Debug logger** - automatické logování všech MCP requestů (sanitized)
- **Error handler** - konzistentní error responses (bez sensitive info)
- **OAuth token injector** - automatické přidání Bearer tokenu do MCP requestů (pokud OAuth konfigurován)
- **API key injector** - automatické přidání API klíče do headers podle konfigurace (pokud API key konfigurován)
- **Token refresh interceptor** - automatický refresh expirovaných tokenů před requestem
- **OAuth error handler** - handling 401 Unauthorized s WWW-Authenticate headerem
- **Header merge strategy** - kombinace OAuth tokenů a API klíčů podle priority
- **Request size limiter** - max request body size
- **Timeout handler** - request timeout handling

### 5. Frontend (`apps/frontend`)

#### Stránky

- **Profiles** - seznam, vytvoření, úprava profilů
  - Zobrazení MCP endpoint URL pro každý profil (`/api/mcp/:profileId`)
  - Copy-to-clipboard pro snadné přidání do AI nástrojů
  - Zobrazení transport type (HTTP/SSE)
  
- **McpServers** - správa externích MCP serverů
  - Přidání remote MCP serveru (HTTP/SSE)
  - OAuth flow setup s callback handling
  - API klíč setup (alternativa k OAuth)
  - Linear MCP quick setup (pre-filled konfigurace)
  
- **CustomMcp** - vytváření a správa vlastních MCP
  - Editor s syntax highlighting
  - Hot-reload preview
  
- **DebugLogs** - přehledné zobrazení debug logů s filtrováním
  - Filtrování podle profilu, MCP serveru, request type
  - JSON viewer pro request/response payloads

#### Komponenty

- ProfileCard, McpServerCard
  - Zobrazení MCP endpoint URL
  - Quick copy button
  - Status indikátor (online/offline)
  
- OAuthFlowHandler
  - OAuth consent screen redirect handling
  - Callback processing
  - Success/error states
  
- ApiKeyInput
  - Secure input pro API klíče
  - Header configuration (Authorization, X-API-Key, custom)
  - Template editor pro header values
  
- DebugLogViewer s JSON viewer
- CustomMcpEditor s syntax highlighting
- Form komponenty z shadcn-ui

## OAuth 2.1 implementace podle MCP standardu

### Požadavky podle MCP specifikace (2025-06-18)

1. **OAuth 2.1 compliance**
   - Authorization Code Flow s PKCE (povinné podle OAuth 2.1)
   - Resource Indicators (RFC 8707) - `resource` parameter v authorization a token requests
   - Dynamic Client Registration (RFC 7591) - podpora pro automatickou registraci klientů
   - Protected Resource Metadata (RFC 9728) - discovery mechanismus pro authorization server
   - Authorization Server Metadata (RFC 8414) - discovery endpoint metadata

2. **Authorization Flow kroky**
   - MCP server vrací `401 Unauthorized` s `WWW-Authenticate` headerem obsahujícím resource metadata URL
   - Client extrahuje resource metadata URL z headeru
   - Client získá Protected Resource Metadata (obsahuje `authorization_servers`)
   - Client získá Authorization Server Metadata (endpoints, capabilities)
   - Client provede Dynamic Client Registration (pokud podporováno, jinak použije hardcoded/manuální client ID)
   - Client generuje PKCE code_verifier a code_challenge (SHA256)
   - Client redirectuje uživatele na authorization server s `resource` parametrem a PKCE
   - Uživatel autorizuje aplikaci
   - Authorization server redirectuje zpět na callback URL s authorization code
   - Client vymění code za access token (s code_verifier, resource parametrem)
   - Client ukládá access token a refresh token (pokud poskytnut)
   - Client používá access token v `Authorization: Bearer` headeru pro všechny MCP requests

3. **Token management**
   - Secure storage v SQLite (encrypted pomocí Node.js crypto)
   - Automatic refresh před expirací (s refresh tokenem)
   - Token audience validation - token musí být vydán pro konkrétní MCP server
   - Token rotation pro refresh tokens (podle OAuth 2.1)

4. **Bezpečnostní požadavky**
   - Všechny authorization server endpoints přes HTTPS
   - Redirect URIs pouze localhost nebo HTTPS
   - State parameter pro CSRF protection
   - PKCE povinné pro všechny flows
   - Token audience binding - prevence token passthrough

### Příklad: Linear MCP setup

Linear MCP server podporuje dva způsoby připojení:

#### 1. OAuth 2.1 flow (doporučeno)

Podle [Linear MCP dokumentace](https://linear.app/docs/mcp):
- **HTTP endpoint**: `https://mcp.linear.app/mcp`
- **SSE endpoint**: `https://mcp.linear.app/sse`
- OAuth 2.1 s dynamic client registration
- Consent screen redirectuje zpět na callback URL aplikace
- Token se ukládá po úspěšné autorizaci

**Konfigurace v aplikaci:**
```json
{
  "type": "remote_http", // nebo "remote_sse"
  "config": {
    "url": "https://mcp.linear.app/mcp",
    "transport": "http" // nebo "sse"
  },
  "oauthConfig": {
    "authorizationServerUrl": "https://linear.app/oauth",
    "resource": "https://mcp.linear.app",
    "scopes": ["read", "write"],
    "requiresOAuth": true,
    "callbackUrl": "http://localhost:3001/api/oauth/callback"
  }
}
```

#### 2. API klíč (alternativa)

Podle [Linear MCP dokumentace](https://linear.app/docs/mcp), lze použít API klíč přímo:
- Přidání API klíče přes UI
- Automatické přidání do `Authorization: Bearer <token>` headeru
- Žádný OAuth flow potřebný

**Konfigurace v aplikaci:**
```json
{
  "type": "remote_http",
  "config": {
    "url": "https://mcp.linear.app/mcp",
    "transport": "http"
  },
  "apiKeyConfig": {
    "apiKey": "<user-provided-api-key>",
    "headerName": "Authorization",
    "headerValue": "Bearer {apiKey}"
  }
}
```

**UI flow:**
1. Uživatel přidá Linear MCP server
2. Vybere mezi OAuth flow nebo API klíč
3. Pokud OAuth: otevře se consent screen, po autorizaci redirect zpět do aplikace
4. Pokud API klíč: uživatel zadá klíč, který se uloží encrypted
5. Při každém requestu se automaticky přidá správný header

## Database migrace a seedy

### Migrační systém

- Verzované migrace v `packages/database/src/migrations/`
- Každá migrace má `up()` a `down()` metody pro rollback
- Automatické spuštění při startu aplikace
- Tracking migrací v databázi (`migrations` tabulka)
- Migrace se spouští v transakcích pro atomicitu

### Seed systém pro onboarding

Při prvním spuštění aplikace se automaticky spustí seedy (pokud databáze je prázdná):

1. **Výchozí profily**
   - "Default" profil s příkladem MCP serverů
   - "Development" profil pro vývoj

2. **Příklad MCP servery**
   - Linear MCP (s OAuth konfigurací a setup instrukcemi)
   - File system MCP (lokální, bez OAuth)
   - Web search MCP (příklad vlastního MCP)

3. **Konfigurační šablony**
   - OAuth 2.1 setup šablony pro populární služby (Linear, GitHub, atd.)
   - Příklady vlastních MCP struktur
   - Dokumentace v databázi pro quick start

### Seed struktura

```typescript
// packages/database/src/seeds/default-profiles.ts
export const defaultProfiles = [
  {
    id: 'default-profile',
    name: 'Default',
    description: 'Default profile with example MCP servers',
    mcpServers: ['linear-mcp-example', 'filesystem-mcp']
  }
];

// packages/database/src/seeds/example-mcp-servers.ts
export const exampleMcpServers = [
  {
    id: 'linear-mcp-example',
    name: 'Linear (Example)',
    type: 'external',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-linear']
    },
    oauthConfig: {
      authorizationServerUrl: 'https://linear.app/oauth',
      resource: 'https://api.linear.app',
      scopes: ['read', 'write'],
      requiresOAuth: true
    }
  }
];
```

## Vlastní MCP struktura

Každý vlastní MCP v `custom-mcps/` musí mít:

```typescript
// custom-mcps/my-mcp/index.ts
import { McpServer } from '@local-mcp/core';
import { z } from 'zod';

export default class MyMcpServer extends McpServer {
  async initialize() {
    // Inicializace
  }

  async listTools() {
    return [
      {
        name: 'my_tool',
        description: 'Tool description',
        inputSchema: z.object({ ... })
      }
    ];
  }

  async callTool(name: string, args: unknown) {
    // Business logika + API volání
  }
}
```

## Dockerizace

### Docker setup

1. **Backend Dockerfile**
   - Multi-stage build pro optimalizaci velikosti
   - Node.js 20+ LTS base image
   - Production dependencies pouze
   - SQLite databáze jako volume mount
   - Healthcheck endpoint

2. **Frontend Dockerfile**
   - Multi-stage build (build + nginx serve)
   - Vite build v build stage
   - Nginx pro serving statických souborů
   - Production optimalizace

3. **Docker Compose**
   - Backend service
   - Frontend service
   - Volume pro SQLite databázi
   - Volume pro custom-mcps
   - Environment variables
   - Network configuration
   - Health checks

### Docker konfigurace

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data          # SQLite databáze
      - ./custom-mcps:/app/custom-mcps
    environment:
      - NODE_ENV=production
      - PORT=3001
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:3001
```

## Turborepo konfigurace

### Turbo pipeline

- **Build pipeline**: Závislosti mezi packages, caching
- **Dev pipeline**: Paralelní spuštění backendu a frontendu s hot-reload
- **Test pipeline**: Paralelní testy napříč packages
- **Lint pipeline**: Linting všech packages

### Turborepo tasks

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Root dev script

V root `package.json`:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:backend": "turbo run dev --filter=backend",
    "dev:frontend": "turbo run dev --filter=frontend",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "test:e2e": "playwright test",
    "test:coverage": "turbo run test:coverage",
    "test:watch": "turbo run test:watch"
  }
}
```

Backend a frontend mají vlastní `dev` scripty s hot-reload:
- **Backend**: `tsx watch` nebo `nodemon` pro TypeScript hot-reload
- **Frontend**: Vite dev server s HMR (Hot Module Replacement)

### Test scripts

- `pnpm test` - spuštění všech testů (unit + integration)
- `pnpm test:unit` - pouze unit testy
- `pnpm test:integration` - pouze integration testy
- `pnpm test:e2e` - E2E testy (Playwright)
- `pnpm test:coverage` - testy s coverage reportem
- `pnpm test:watch` - watch mode pro TDD workflow

## Developer Experience

### CLI nástroje

- `pnpm dev` - **spuštění obou služeb z rootu** (backend + frontend) pomocí Turborepo s hot-reload
- `pnpm dev:backend` - pouze backend s hot-reload
- `pnpm dev:frontend` - pouze frontend s hot-reload
- `pnpm create-custom-mcp <name>` - scaffold nového vlastního MCP v `custom-mcps/`
- `pnpm create-package <name>` - scaffold nového publikovatelného package v `packages/`
- `pnpm build` - produkční build všech packages pomocí Turborepo
- `pnpm docker:build` - build Docker images
- `pnpm docker:up` - spuštění Docker Compose
- `pnpm docker:down` - zastavení Docker Compose

### Hot-reload konfigurace

- **Backend**: `tsx watch` nebo `nodemon` s TypeScript watch mode
- **Frontend**: Vite dev server s HMR (Hot Module Replacement)
- **Custom MCP**: Hot-reload pomocí `chokidar` pro sledování změn v `custom-mcps/`
- **Database**: Migrace se spouští automaticky při změnách

### TypeScript konfigurace

- Strict mode enabled
- Path aliases pro čisté importy
- Shared tsconfig base v rootu
- Workspace-aware TypeScript pro packages

### MCP implementace - dva přístupy

1. **Jednoduchá implementace** (defaultní, doporučené)
   - Vytvoření souboru v `custom-mcps/<name>/index.ts`
   - Implementace třídy dědící z `McpServer` z `@local-mcp/core`
   - Žádná nutnost vytvářet package nebo publikovat
   - Hot-reload v dev módu

2. **Publikovatelný package** (pro sdílení nebo distribuci)
   - Vytvoření nového package v `packages/mcp-<name>/`
   - Plná konfigurace `package.json` s publishing
   - Možnost publikovat na npm nebo private registry
   - Použití v aplikaci přes workspace protocol

## Dokumentace

### Dokumentační struktura

Dokumentace je rozdělena do logických sekcí pro různé typy uživatelů:

#### 1. Getting Started (`docs/getting-started/`)

**Cíl:** Rychlý start pro nové uživatele

**Obsah:**
- **installation.md** - Instalace a setup (pnpm, Docker)
- **quick-start.md** - 5-minutový quick start guide
- **first-profile.md** - Vytvoření prvního profilu krok za krokem

**Požadavky:**
- Screenshots a GIFy pro vizuální návod
- Copy-paste ready příkazy
- Troubleshooting sekce pro běžné problémy

#### 2. User Guides (`docs/guides/`)

**Cíl:** Detailní návody pro všechny hlavní funkcionality

**Obsah:**
- **creating-profiles.md** - Jak vytvářet a spravovat profily
- **adding-mcp-servers.md** - Přidávání externích MCP serverů
- **oauth-setup.md** - OAuth 2.1 setup guide
  - **linear.md** - Linear MCP setup (HTTP i SSE)
  - **github.md** - GitHub MCP setup
  - **custom.md** - Vlastní OAuth servery
- **api-keys.md** - Nastavení API klíčů jako alternativa k OAuth
- **custom-mcp.md** - Vytváření vlastních MCP serverů
  - Jednoduchá implementace
  - Publikovatelný package
  - Best practices
- **docker-deployment.md** - Docker deployment guide
- **troubleshooting.md** - Řešení běžných problémů

**Požadavky:**
- Krok za krokem návody s příklady
- Screenshots UI
- Code příklady
- Common pitfalls a jak se jim vyhnout

#### 3. API Documentation (`docs/api/`)

**Cíl:** Kompletní API reference

**Obsah:**
- **overview.md** - API přehled, autentizace, base URL
- **profiles.md** - Profile management API
  - CRUD operace
  - Request/response příklady
  - Error codes
- **mcp-servers.md** - MCP server management API
- **oauth.md** - OAuth endpoints
  - Authorization flow
  - Callback handling
  - Token management
- **proxy-endpoints.md** - MCP proxy endpointy per profil
  - HTTP endpoint (`/api/mcp/:profileId`)
  - SSE endpoint (`/api/mcp/:profileId/sse`)
  - Použití v AI nástrojích (Cursor, Claude)
- **debug-logs.md** - Debug logs API

**Požadavky:**
- Automaticky generovaná z TypeDoc komentářů
- OpenAPI/Swagger specifikace (volitelné)
- Request/response příklady pro každý endpoint
- Error handling dokumentace
- Rate limiting informace

#### 4. Architecture (`docs/architecture/`)

**Cíl:** Technická dokumentace pro vývojáře

**Obsah:**
- **overview.md** - Architektura aplikace, diagramy
- **mcp-proxy.md** - Jak funguje MCP proxy
- **oauth-flow.md** - OAuth 2.1 flow podle MCP standardu
- **database-schema.md** - Databázové schéma a vztahy

**Požadavky:**
- Mermaid diagramy
- Sequence diagramy pro flows
- ER diagramy pro databázi
- Komponenty a jejich interakce

#### 5. Development (`docs/development/`)

**Cíl:** Dokumentace pro přispěvatele

**Obsah:**
- **setup.md** - Development environment setup
- **tdd-workflow.md** - Jak psát testy, TDD principy
- **contributing.md** - Contributing guidelines
  - Code style
  - Commit conventions
  - PR process
- **code-style.md** - Coding standards a conventions
- **testing.md** - Testování guide
  - Unit testy
  - Integration testy
  - E2E testy
  - Coverage requirements

**Požadavky:**
- Clear instructions pro nové přispěvatele
- Code examples
- Best practices

#### 6. Examples (`docs/examples/`)

**Cíl:** Praktické příklady a use cases

**Obsah:**
- **simple-mcp.md** - Jednoduchý custom MCP příklad
- **oauth-mcp.md** - Custom MCP s OAuth integrací
- **api-integration.md** - Integrace s externími API

**Požadavky:**
- Kompletní working příklady
- Copy-paste ready kód
- Vysvětlení každého kroku

### Code dokumentace

#### JSDoc komentáře

**Požadavky:**
- Všechny public funkce, třídy, metody mají JSDoc komentáře
- Popis parametrů, návratových hodnot, exceptions
- Příklady použití v komentářích
- TypeDoc generuje API dokumentaci automaticky

**Příklad:**
```typescript
/**
 * Creates a new profile with the given name and description.
 * 
 * @param name - Profile name (alphanumeric + dash/underscore, max 50 chars)
 * @param description - Optional profile description
 * @returns Created profile with MCP endpoint URL
 * @throws {ValidationError} If name is invalid or already exists
 * 
 * @example
 * ```typescript
 * const profile = await profileManager.create({
 *   name: 'my-profile',
 *   description: 'My first profile'
 * });
 * console.log(profile.mcpEndpoint); // '/api/mcp/my-profile'
 * ```
 */
async create(name: string, description?: string): Promise<Profile> {
  // Implementation
}
```

#### Inline komentáře

- Komplexní logika má inline komentáře
- Business rules jsou zdokumentované
- Security considerations jsou vysvětlené
- Performance optimizations jsou zdokumentované

### README soubory

#### Root README.md

**Obsah:**
- Project description
- Quick start (5 minut)
- Features overview
- Installation
- Basic usage
- Links na detailní dokumentaci
- Badges (coverage, build status)
- Contributing link

#### Package README.md

Každý package má vlastní README:
- Purpose a responsibility
- Installation
- Usage examples
- API overview
- Links na detailní dokumentaci

### Dokumentační nástroje

#### TypeDoc

- Automatická generace API dokumentace z TypeScript
- HTML output v `docs/api/typedoc/`
- Integrace do CI/CD pro automatické aktualizace

#### Mermaid diagramy

- Architektura diagramy
- Sequence diagramy pro flows
- ER diagramy pro databázi
- Renderování v Markdown (GitHub, VS Code)

#### Markdown linting

- Markdownlint pro konzistenci
- Pre-commit hooks pro validaci
- Automatické formátování

### Dokumentační workflow

#### Při vývoji

- Dokumentace se píše současně s kódem
- JSDoc komentáře jsou součástí code review
- README aktualizace při změnách funkcionalit

#### Před release

- Review všech dokumentací
- Aktualizace příkladů
- Kontrola broken links
- Screenshots aktualizace (pokud UI změny)

#### Automatizace

- TypeDoc generace v CI/CD
- Broken link checking
- Markdown linting
- Documentation coverage check

### Dokumentační požadavky

#### Povinné pro každou funkcionalitu

- User guide (pokud user-facing)
- API dokumentace (pokud API endpoint)
- Code comments (JSDoc)
- Test dokumentace (pokud komplexní)
- Changelog entry

#### Kvalita dokumentace

- **Clarity** - Jasné a srozumitelné
- **Completeness** - Kompletní informace
- **Examples** - Praktické příklady
- **Accuracy** - Aktuální a přesné
- **Accessibility** - Snadno dostupné

### Dokumentační metriky

- **Coverage** - Všechny public API mají dokumentaci
- **Freshness** - Dokumentace je aktuální s kódem
- **Usability** - Uživatelé dokáží použít aplikaci pouze z dokumentace

### Lokalizace (budoucí)

- Angličtina jako primární jazyk
- Možnost rozšíření o další jazyky v budoucnu
- Struktura podporuje lokalizaci

## Bezpečnost a validace

### Input validace

- **Zod schémata pro všechny API endpointy**
  - Request body validace před zpracováním
  - Query parameter validace
  - Path parameter validace (profileId, mcpServerId)
  - Response validace před odesláním
  - Type-safe validace napříč celou aplikací

- **Konkrétní validace:**
  - Profile names: alphanumeric + dash/underscore, max length
  - MCP server URLs: valid URL format, HTTPS only pro remote servers
  - OAuth config: valid authorization server URL, resource URL format
  - API keys: format validation podle typu (Bearer token, API key pattern)
  - Custom MCP code: syntax validation před načtením
  - File paths: path traversal prevence (`../` blocking)

### SQL injection prevence

- **Prepared statements** pro všechny databázové dotazy
- **Parameterized queries** - žádné string concatenation
- **Input sanitization** před vložením do SQL
- **Type validation** - zajištění správných typů před dotazem
- **ORM abstrakce** - database repository vrstva používá pouze safe metody

### XSS (Cross-Site Scripting) prevence

- **Frontend:**
  - React automaticky escapuje HTML
  - Sanitizace uživatelského vstupu před zobrazením
  - Content Security Policy (CSP) headers
  - No `dangerouslySetInnerHTML` bez sanitizace

- **Backend:**
  - JSON responses pouze (ne HTML injection)
  - Proper Content-Type headers
  - Input sanitization před uložením do databáze

### CSRF (Cross-Site Request Forgery) prevence

- **OAuth flow:**
  - State parameter validace
  - PKCE code_verifier validation
  - Origin validation v callback handleru

- **API endpointy:**
  - SameSite cookies (pokud použity)
  - Origin/Referer header validation pro kritické operace
  - CSRF tokens pro state-changing operace (DELETE, POST, PUT)

### Rate limiting

- **Per-endpoint rate limiting:**
  - MCP proxy endpointy: rate limit podle profilu
  - OAuth endpoints: rate limit podle IP
  - API endpoints: rate limit podle akce
  - Debug logs endpoint: rate limit pro prevenci DoS

- **Implementace:**
  - `express-rate-limit` middleware
  - Redis nebo in-memory store pro rate limit tracking
  - Configurable limits per endpoint type

### Authentication a Authorization

- **OAuth token validace:**
  - JWT signature verification (pokud JWT)
  - Token expiration check
  - Token audience validation (RFC 8707)
  - Token scope validation
  - Secure token storage (encrypted)

- **API key validace:**
  - Format validation před uložením
  - Secure storage (encrypted v SQLite)
  - Revocation support
  - Expiration support (volitelné)

- **Profile access:**
  - Profile ID validation před přístupem
  - Existence check před operacemi
  - Ownership validation (pokud multi-user v budoucnu)

### Sandboxing vlastních MCP modulů

- **Code execution isolation:**
  - VM2 nebo isolated worker threads pro custom MCP
  - Resource limits (CPU, memory, execution time)
  - Network access restrictions
  - File system access restrictions
  - No eval() nebo Function() konstruktor

- **Module loading security:**
  - Whitelist povolených imports
  - No require() dynamických modulů
  - Path validation před require()
  - Sandboxed environment pro každý custom MCP

### Secure headers

- **HTTP Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (HSTS) pro HTTPS
  - `Content-Security-Policy` s restriktivními pravidly
  - `Referrer-Policy: strict-origin-when-cross-origin`

### CORS konfigurace

- **Restriktivní CORS policy:**
  - Povolené origin pouze pro lokální vývoj
  - No wildcard origins v production
  - Credentials pouze pro trusted origins
  - Preflight request handling

### Environment variable validace

- **Startup validace:**
  - Required env vars check při startu
  - Format validation (URLs, ports, secrets)
  - Default values pouze pro non-sensitive config
  - Error při chybějících kritických proměnných

### Database security

- **Connection security:**
  - SQLite file permissions (600 - read/write pouze pro owner)
  - Database file path validation
  - Backup encryption

- **Data integrity:**
  - Foreign key constraints
  - Unique constraints
  - Check constraints pro data validation
  - Transaction isolation

### OAuth security

- **OAuth flow security:**
  - PKCE povinné pro všechny flows
  - State parameter validation
  - Redirect URI validation (whitelist)
  - Authorization code jednorázové použití
  - Token binding validation

- **Token security:**
  - Secure token storage (encrypted)
  - Token rotation pro refresh tokens
  - Token revocation support
  - Short-lived access tokens

### API key security

- **Storage:**
  - Encryption at rest (AES-256)
  - Encryption key management (environment variable)
  - No plaintext storage

- **Usage:**
  - Header injection validation
  - Template injection prevence v header values
  - No logging API keys

### Logging security

- **Sensitive data:**
  - No logging passwords, API keys, access tokens
  - Sanitized debug logs (masked tokens)
  - PII (Personally Identifiable Information) redaction

### Error handling security

- **Error messages:**
  - No stack traces v production responses
  - Generic error messages pro uživatele
  - Detailed errors pouze v server logs
  - No internal path disclosure

### File upload security (custom MCP)

- **Validation:**
  - File type validation (pouze .ts, .js)
  - File size limits
  - Filename sanitization
  - Path traversal prevence
  - Content validation (syntax check)

### Network security

- **HTTPS enforcement:**
  - HTTPS pouze v production
  - Certificate validation
  - TLS 1.2+ requirement

- **Request validation:**
  - Request size limits
  - Timeout handling
  - Connection limits

### Dependency security

- **Package management:**
  - Regular dependency updates
  - Security audit (`pnpm audit`)
  - Lock file integrity
  - No known vulnerabilities

### Security testing

- **Automated testing:**
  - Input validation testy
  - SQL injection testy
  - XSS testy
  - CSRF testy
  - Rate limiting testy
  - OAuth flow testy

- **Manual security review:**
  - Code review s security focus
  - Penetration testing (volitelné)
  - Security audit před release

## Test-Driven Development (TDD)

### TDD workflow

**Zlaté pravidlo:** Žádný kód se nesmí implementovat bez předchozího testu. Všechny testy musí projít před merge do main branchu.

**Workflow:**
1. **Red** - Napsat failing test
2. **Green** - Implementovat minimální kód pro projítí testu
3. **Refactor** - Refaktorovat kód při zachování procházejících testů
4. **Repeat** - Opakovat pro další funkcionalitu

### Code coverage požadavky

- **Minimální code coverage: 90%**
- **Blokování merge** pokud coverage < 90%
- **Coverage report** v každém PR
- **Coverage thresholds:**
  - Statements: 90%
  - Branches: 90%
  - Functions: 90%
  - Lines: 90%

### Testovací pyramida

```
        /\
       /E2E\         10% - E2E testy (Playwright)
      /------\
     /Integration\   30% - Integration testy (Vitest + Supertest)
    /------------\
   /   Unit Tests \  60% - Unit testy (Vitest)
  /----------------\
```

#### 1. Unit testy (60% testů)

**Cíl:** Testování jednotlivých funkcí, tříd a komponent v izolaci.

**Technologie:** Vitest

**Testované oblasti:**
- Core abstrakce (`McpServer`, `ProxyHandler`, `ProfileManager`, `OAuthManager`, `ApiKeyManager`)
- Database repositories (mock databáze)
- Utility funkce
- React komponenty (izolované s @testing-library/react)
- Validace (zod schémata)
- Security funkce (encryption, token validation)

**Příklady:**
```typescript
// packages/core/src/__tests__/ProfileManager.test.ts
describe('ProfileManager', () => {
  it('should create profile with valid name', async () => {
    // Test implementation
  });
  
  it('should reject profile with invalid name', async () => {
    // Test implementation
  });
});
```

#### 2. Integration testy (30% testů)

**Cíl:** Testování interakce mezi komponentami a moduly.

**Technologie:** Vitest + Supertest + MSW

**Testované oblasti:**
- API endpointy (Express routes)
- Database operace (skutečná SQLite test databáze)
- OAuth flow (mock authorization server)
- MCP proxy logika (mock MCP servery)
- Middleware chain
- Error handling flows

**Příklady:**
```typescript
// apps/backend/src/__tests__/integration/profiles.test.ts
describe('Profiles API Integration', () => {
  it('should create profile and return MCP endpoint URL', async () => {
    const response = await request(app)
      .post('/api/profiles')
      .send({ name: 'test-profile' });
    
    expect(response.status).toBe(201);
    expect(response.body.mcpEndpoint).toContain('/api/mcp/test-profile');
  });
});
```

#### 3. E2E testy (10% testů)

**Cíl:** Testování kompletních user flows přes celou aplikaci.

**Technologie:** Playwright

**Testované flows:**
- Onboarding flow (první spuštění, seed data)
- Vytvoření profilu a přidání MCP serveru
- OAuth flow (Linear MCP setup)
- API klíč setup
- Vytvoření custom MCP
- Debug logs zobrazení
- Přidání profilu do AI nástroje (simulace)

**Příklady:**
```typescript
// apps/frontend/e2e/profiles.spec.ts
import { test, expect } from '@playwright/test';

test('should create profile and display MCP endpoint', async ({ page }) => {
  await page.goto('/profiles');
  await page.click('button:has-text("Create Profile")');
  await page.fill('input[name="name"]', 'test-profile');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('text=/api\\/mcp\\/test-profile/')).toBeVisible();
});
```

### Test struktura

```
local_mcp_ui/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   └── __tests__/
│   │       ├── unit/
│   │       └── integration/
│   ├── database/
│   │   ├── src/
│   │   └── __tests__/
│   │       ├── unit/
│   │       └── integration/
│   └── custom-mcp-loader/
│       ├── src/
│       └── __tests__/
│           ├── unit/
│           └── integration/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   └── __tests__/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── fixtures/
│   └── frontend/
│       ├── src/
│       ├── __tests__/
│       │   ├── unit/
│       │   └── integration/
│       └── e2e/
│           ├── profiles.spec.ts
│           ├── mcp-servers.spec.ts
│           ├── oauth-flow.spec.ts
│           └── custom-mcp.spec.ts
└── vitest.config.ts
└── playwright.config.ts
```

### Test fixtures a mocks

- **MCP server mocks** - mock implementace pro testování proxy logiky
- **OAuth server mocks** - MSW handlers pro OAuth flow testy
- **Database fixtures** - seed data pro testy
- **API mocks** - MSW pro externí API volání

### Test coverage konfigurace

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.config.*',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

### CI/CD test pipeline

**Pre-commit hooks:**
- Linting (Biome)
- Type checking (TypeScript)
- Unit testy (Vitest)
- Coverage check (90% minimum)

**PR checks:**
- Všechny unit testy
- Všechny integration testy
- E2E testy (Playwright)
- Coverage report
- **Blokování merge** pokud:
  - Jakýkoliv test selže
  - Coverage < 90%
  - Type errors

**GitHub Actions workflow:**
```yaml
- Run unit tests
- Run integration tests
- Run E2E tests (Playwright)
- Generate coverage report
- Fail if coverage < 90%
- Comment coverage in PR
```

### Testování bezpečnosti

- **Input validation testy** - SQL injection, XSS, path traversal
- **OAuth flow testy** - state validation, PKCE, token validation
- **Rate limiting testy** - DoS prevence
- **Sandboxing testy** - custom MCP isolation
- **CSRF testy** - cross-site request forgery

### Test performance

- **Unit testy:** < 1s celkově
- **Integration testy:** < 10s celkově
- **E2E testy:** < 2 min celkově
- **Paralelní execution** pomocí Vitest a Playwright workers

### Test maintenance

- **Test dokumentace** - každý test má popisný název a komentář
- **Test data management** - fixtures pro konzistentní test data
- **Flaky test detection** - retry mechanismus pro E2E testy
- **Test review** - code review zahrnuje i testy

## Fáze implementace (TDD workflow)

**Důležité:** Každá fáze následuje TDD principy - nejdřív testy, pak implementace.

### Fáze 0: Test infrastructure setup

- Vitest konfigurace
- Playwright konfigurace
- Coverage thresholds (90%)
- Test fixtures a mocks setup
- CI/CD pipeline pro testy
- Pre-commit hooks (testy + coverage check)

### 1. **Fáze 1: Základní infrastruktura**

**TDD workflow:**
1. Napsat unit testy pro core abstrakce
2. Napsat integration testy pro database vrstvu
3. Implementovat core abstrakce (aby testy prošly)
4. Implementovat database vrstvu (aby testy prošly)
5. Coverage check (90% minimum)
6. **Dokumentace**: JSDoc komentáře, architecture docs, getting started guide

**Implementace:**
- Projekt setup (pnpm workspace + Turborepo)
- Turborepo konfigurace a pipeline
- Database schéma a migrační systém s verzováním
- Seed systém pro onboarding
- Core abstrakce (`McpServer`, `ProxyHandler`, `ProfileManager`)

**Testy:**
- Unit testy pro všechny core abstrakce
- Integration testy pro database operace
- E2E test pro onboarding flow (seed data)

### 2. **Fáze 2: OAuth 2.1 implementace**

**TDD workflow:**
1. Napsat unit testy pro OAuthManager
2. Napsat integration testy pro OAuth flow
3. Napsat E2E test pro OAuth consent screen flow
4. Implementovat OAuthManager (aby testy prošly)
5. Coverage check (90% minimum)
6. **Dokumentace**: OAuth flow guide, Linear setup guide, architecture docs

**Implementace:**
- OAuthManager podle MCP standardu (2025-06-18)
- Dynamic Client Registration podpora (RFC 7591)
- PKCE implementace (code_verifier, code_challenge)
- Resource parameter handling (RFC 8707)
- Protected Resource Metadata discovery (RFC 9728)
- Authorization Server Metadata discovery (RFC 8414)
- Token management a refresh
- Secure token storage (encryption)

**Testy:**
- Unit testy pro OAuthManager metody
- Integration testy pro OAuth flow (mock authorization server)
- E2E test pro Linear OAuth setup flow

### 3. **Fáze 3: Backend proxy**

**TDD workflow:**
1. Napsat unit testy pro proxy handler
2. Napsat integration testy pro API endpointy
3. Napsat E2E testy pro MCP endpointy per profil
4. Implementovat Express server a endpointy (aby testy prošly)
5. Coverage check (90% minimum)
6. **Dokumentace**: API dokumentace (TypeDoc + manuální), proxy endpoints guide, jak přidat profil do AI nástrojů

**Implementace:**
- Express server setup s hot-reload (tsx watch)
- MCP proxy endpointy per profil (`/api/mcp/:profileId`, `/api/mcp/:profileId/sse`)
- Proxy handler pro externí MCP (HTTP i SSE transport)
- OAuth callback endpoints s redirect do UI
- API klíč management a injection
- Profil management API
- Token/API key injection middleware
- Header merge strategy

**Testy:**
- Unit testy pro proxy handler logiku
- Integration testy pro všechny API endpointy (Supertest)
- E2E testy pro vytvoření profilu a použití MCP endpointu

### 4. **Fáze 4: Custom MCP loader**

**TDD workflow:**
1. Napsat unit testy pro module loader
2. Napsat integration testy pro custom MCP načítání
3. Napsat E2E test pro vytvoření custom MCP
4. Implementovat loader (aby testy prošly)
5. Coverage check (90% minimum)
6. **Dokumentace**: Custom MCP guide, examples, best practices

**Implementace:**
- Module loader pro jednoduché MCP implementace
- Validace a error handling
- Integration s proxy
- Hot-reload support

**Testy:**
- Unit testy pro module loader a validaci
- Integration testy pro načítání custom MCP
- E2E test pro vytvoření a použití custom MCP

### 5. **Fáze 5: Frontend**

**TDD workflow:**
1. Napsat unit testy pro React komponenty
2. Napsat integration testy pro API integraci
3. Napsat E2E testy pro všechny user flows
4. Implementovat UI komponenty (aby testy prošly)
5. Coverage check (90% minimum)
6. **Dokumentace**: User guides s screenshots, UI workflow dokumentace

**Implementace:**
- Vite dev server setup s HMR
- UI komponenty
- OAuth flow UI (authorization redirect, callback handling, status, token management)
- API klíč management UI
- Profile MCP endpoint URL display a copy functionality
- Onboarding flow s seed daty
- API integrace
- Debug logs viewer

**Testy:**
- Unit testy pro všechny React komponenty (@testing-library/react)
- Integration testy pro API integraci (MSW mocks)
- E2E testy pro všechny user flows (Playwright)

### 6. **Fáze 6: Dockerizace**

**TDD workflow:**
1. Napsat E2E testy pro Docker setup
2. Implementovat Docker konfiguraci
3. Ověřit že všechny testy procházejí v Docker

**Implementace:**
- Backend Dockerfile (multi-stage)
- Frontend Dockerfile (multi-stage s nginx)
- Docker Compose konfigurace
- Health checks
- Volume management pro SQLite a custom-mcps
- Environment variables setup
- Production optimalizace

**Testy:**
- E2E testy v Docker prostředí
- Health check testy

### 7. **Fáze 7: Polish a dokumentace**

**TDD workflow:**
1. Přidat testy pro edge cases
2. Performance testy
3. Security testy
4. **Kompletní dokumentace** (současně s každou funkcionalitou)

**Implementace:**
- Error handling improvements
- Performance optimalizace
- **Kompletní dokumentační struktura:**
  - Getting Started guides (installation, quick-start, first-profile)
  - User Guides (všechny hlavní funkcionality)
  - API dokumentace (TypeDoc generovaná + manuální)
  - Architecture dokumentace (diagramy, flows)
  - Development dokumentace (setup, TDD, contributing)
  - Examples (příklady pro všechny use cases)
- OAuth setup guide pro různé MCP servery (Linear, GitHub, atd.)
- Docker deployment guide
- Turborepo workflow dokumentace
- Test dokumentace (jak psát testy, TDD workflow)
- **JSDoc komentáře** pro všechny public API
- **README soubory** pro všechny packages a apps

**Dokumentační požadavky:**
- Všechny guides mají screenshots/GIFy
- Všechny API endpointy mají request/response příklady
- Všechny code příklady jsou testované a working
- Diagramy (Mermaid) pro architekturu a flows
- TypeDoc generovaná API dokumentace
- Broken link checking
- Markdown linting

### To-dos

- [ ] Nastavení monorepo struktury: pnpm workspace + Turborepo konfigurace, TypeScript konfigurace, Biome setup
- [ ] Konfigurace dev workflow: `pnpm dev` z rootu spouští obě služby s hot-reload (Turborepo pipeline)
- [ ] Implementace core abstrakcí: McpServer třída, ProxyHandler, ProfileManager, OAuthManager, ApiKeyManager s plným typováním
- [ ] Vytvoření database vrstvy: SQLite schéma (rozšířené o api_key_config), migrační systém s verzováním, seed systém pro onboarding, repository pattern, **prepared statements pro všechny queries, input sanitization, secure file permissions**
- [ ] Implementace OAuth 2.1 podle MCP standardu: DCR (RFC 7591), PKCE, Resource Indicators (RFC 8707), Protected Resource Metadata (RFC 9728), Authorization Server Metadata (RFC 8414), token management, callback handling, **token validation (signature, expiration, audience, scope), secure storage (encryption), state parameter validation, redirect URI whitelist**
- [ ] Implementace Express backendu: MCP proxy endpointy per profil (`/api/mcp/:profileId`, `/api/mcp/:profileId/sse`), HTTP i SSE transport podpora, profil management API, OAuth callback endpoints s redirect, API klíč management, token/API key injection middleware, header merge strategy, debug logging middleware, **kompletní security middleware stack (rate limiting, CORS, security headers, input validation, sanitization)**
- [ ] Implementace remote MCP proxy: podpora pro HTTP a SSE transport, Linear MCP integrace (oba transporty), automatické header injection (OAuth/API key)
- [ ] Vytvoření custom MCP loaderu: dynamické načítání modulů z custom-mcps/, **strict validace (zod schémata, syntax check, path traversal prevence)**, **sandboxing (VM2/worker threads, resource limits, network/FS restrictions)**, hot-reload pomocí chokidar, podpora pro jednoduché implementace i packages
- [ ] Implementace React frontendu: všechny stránky (Profiles s MCP endpoint URL display, McpServers s OAuth/API key setup, CustomMcp, DebugLogs), OAuth flow UI s callback handling, API klíč management UI, onboarding flow, UI komponenty
- [ ] Hot-reload setup: Backend (tsx watch/nodemon), Frontend (Vite HMR), Custom MCP (chokidar file watcher)
- [ ] Dockerizace: Backend Dockerfile (multi-stage), Frontend Dockerfile (multi-stage s nginx), Docker Compose konfigurace, health checks, volume management
- [ ] Vytvoření CLI nástrojů: scaffold pro custom MCP (jednoduchá varianta), scaffold pro publikovatelné packages, dev workflow scripts
- [ ] **Kompletní dokumentační struktura**: Getting Started (installation, quick-start, first-profile), User Guides (všechny funkcionality), API dokumentace (TypeDoc + manuální), Architecture docs (diagramy), Development docs (setup, TDD, contributing), Examples (příklady)
- [ ] **Code dokumentace**: JSDoc komentáře pro všechny public API, inline komentáře pro komplexní logiku, TypeDoc generovaná dokumentace
- [ ] **README soubory**: Root README s quick start, package README pro každý package, app README pro každou app
- [ ] **Dokumentační nástroje**: TypeDoc setup, Mermaid diagramy, Markdown linting, broken link checking
- [ ] **Dokumentační workflow**: Dokumentace současně s kódem, review v PR, automatizace v CI/CD
- [ ] **Detailní guides**: OAuth setup (Linear HTTP/SSE, GitHub, custom), API keys, Custom MCP (jednoduchá i package), Docker deployment, troubleshooting
- [ ] **API dokumentace**: Kompletní reference pro všechny endpointy, request/response příklady, error handling, rate limiting
- [ ] **Architecture dokumentace**: Diagramy (Mermaid), sequence diagramy pro flows, ER diagramy pro databázi
- [ ] **Examples**: Working příklady pro všechny use cases, copy-paste ready kód, vysvětlení kroků
- [ ] **Fáze 0: Test infrastructure setup**: Vitest konfigurace, Playwright konfigurace, coverage thresholds (90%), test fixtures a mocks, CI/CD pipeline, pre-commit hooks
- [ ] **TDD implementace všech fází**: Každá fáze začíná testy, pak implementace, coverage check 90% před pokračováním
- [ ] Unit testy (60% testů): Core abstrakce, repositories, utilities, React komponenty, validace, security funkce
- [ ] Integration testy (30% testů): API endpointy, database operace, OAuth flow, MCP proxy, middleware chain
- [ ] E2E testy (10% testů): Onboarding flow, vytvoření profilu, OAuth setup, API klíč setup, custom MCP, debug logs, přidání do AI nástroje
- [ ] Security testing: Input validation testy, SQL injection testy, XSS testy, CSRF testy, rate limiting testy, OAuth flow testy, sandboxing testy
- [ ] Coverage enforcement: Pre-commit hooks blokují commit pokud coverage < 90%, CI/CD blokuje merge pokud coverage < 90%