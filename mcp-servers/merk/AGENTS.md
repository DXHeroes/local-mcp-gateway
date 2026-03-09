# Merk MCP Package

## Purpose

MCP server wrapping the **Merk API** (https://api.merk.cz/docs/) — a Czech/Slovak company data platform with 23 tools covering company details, financials, employees, fleet, relations graphs, and more.

## Package Info

- **ID**: `merk`
- **Name**: Merk
- **Version**: 1.0.0
- **Requires API Key**: Yes (Merk API token)

## Structure

```
merk/
├── src/
│   ├── index.ts          # McpPackage export
│   ├── server.ts         # MerkMcpServer extends McpServer
│   ├── client.ts         # MerkClient — thin HTTP wrapper around fetch
│   └── schemas.ts        # Zod input schemas for all 23 tools
├── __tests__/
│   ├── client.test.ts    # Client tests (mock global fetch)
│   └── server.test.ts    # Server tests (mock MerkClient)
├── package.json
├── tsconfig.json
└── AGENTS.md             # This file
```

## Tools Provided (23)

### Company Data
| Tool | Description |
|------|-------------|
| `merk_company_lookup` | Look up company by IČO or DIČ |
| `merk_company_batch` | Batch lookup up to 500 companies |
| `merk_company_suggest` | Autocomplete by name, email, or bank account |
| `merk_search_companies` | Advanced search with filters (CZ/SK) |

### Financials
| Tool | Description |
|------|-------------|
| `merk_financial_statements` | Balance sheet, P&L statements |
| `merk_financial_indicators` | ROE, debt ratio, liquidity, etc. |

### Company Details
| Tool | Description |
|------|-------------|
| `merk_company_employees` | Employee count and structure |
| `merk_company_fleet` | Vehicle fleet data |
| `merk_company_fleet_stats` | Fleet statistics |
| `merk_company_business_premises` | Registered premises |
| `merk_company_licenses` | Trade licenses |
| `merk_company_events` | Registry changes, insolvency filings |
| `merk_company_job_ads` | Job advertisements |
| `merk_company_gov_contracts` | Government contracts |

### Company Feed
| Tool | Description |
|------|-------------|
| `merk_new_companies` | Newly registered companies by date range |
| `merk_updated_companies` | Companies updated in date range |

### Relations Graph
| Tool | Description |
|------|-------------|
| `merk_relations_company` | Company relations (owners, board, subsidiaries) |
| `merk_relations_person` | Person relations (companies owned, boards) |
| `merk_relations_search_person` | Search person in relations graph |
| `merk_relations_shortest_path` | Shortest path between two nodes |

### Utility
| Tool | Description |
|------|-------------|
| `merk_enums` | Enum/code list values (legal forms, NACE, etc.) |
| `merk_subscription_info` | API subscription info and credits |
| `merk_vokativ` | Czech vocative (5th case) form of a name |

## API Key Setup

1. Go to [Merk API](https://www.merk.cz/api/about/)
2. Register and obtain an API token
3. In the UI: MCP Servers > Merk > Configure API Key
4. Paste your token

**API Key Config:**
- Header: `Authorization`
- Format: `Token {apiKey}`

## Error Responses

| Error Code | Description |
|------------|-------------|
| `API_KEY_REQUIRED` | API key not configured |
| `INVALID_API_KEY` | Invalid or expired token (401/403) |
| `NOT_FOUND` | Resource not found (404) |
| `RATE_LIMITED` | Too many requests (429) |
| `BAD_REQUEST` | Invalid request parameters (400) |
| `API_ERROR` | Server error (5xx) |
| `INVALID_INPUT` | Zod input validation failed |
| `UNKNOWN_TOOL` | Unknown tool name |

## Seed Configuration

Automatically added to `default` profile:
- Order: 10
- Active: true

## Development

```bash
# Build
pnpm --filter @dxheroes/mcp-merk build

# Test
pnpm --filter @dxheroes/mcp-merk test

# Clean
pnpm --filter @dxheroes/mcp-merk clean
```

## Dependencies

- `zod` - Input validation
- `@dxheroes/local-mcp-core` (peer) - Core abstractions

## Related Files

- **MCP Servers Guide**: `mcp-servers/AGENTS.md`
- **Core Types**: `packages/core/src/types/mcp-package.ts`
- **McpServer Base**: `packages/core/src/abstractions/McpServer.ts`
