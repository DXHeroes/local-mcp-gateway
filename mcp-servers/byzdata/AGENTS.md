# ByzData MCP Package

## Purpose

Czech business registry data from ARES, Justice.cz, and ISIR. Provides 9 tools for comprehensive Czech company data analysis including search, health checks, insolvency, relations, documents, and more.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - MCP server packages instructions

## Structure

```
byzdata/
├── src/
│   ├── index.ts                    # McpPackage export
│   ├── server.ts                   # ByzdataMcpServer (extends McpServer)
│   ├── clients/
│   │   ├── ares-client.ts          # ARES REST API client
│   │   ├── isir-client.ts          # eISIR insolvency API client
│   │   └── justice-scraper.ts      # or.justice.cz HTML scraper
│   ├── services/
│   │   └── company-service.ts      # Business logic over ARES
│   ├── types/
│   │   ├── ares.ts                 # ARES API response types
│   │   ├── company.ts              # Domain types
│   │   └── isir.ts                 # ISIR API types
│   └── utils/
│       ├── formatters.ts           # Address formatting, IČO padding
│       └── http.ts                 # HTTP client utilities
├── __tests__/
├── package.json
└── tsconfig.json
```

## Tools

- **search_company**: Search Czech companies by name
- **get_company**: Get full company overview by IČO
- **get_company_details**: Get business activities, trade licenses, NACE codes
- **get_company_relations**: Get statutory bodies, shareholders
- **get_company_documents**: Get documents from sbírka listin
- **get_company_extract**: Get full commercial register extract
- **check_insolvency**: Check insolvency register (ISIR)
- **check_company_health**: Comprehensive health check with traffic-light assessment
- **find_related_companies**: Find companies through shared people

## API Key

No API key required. All data sources are public Czech government APIs:
- ARES: https://ares.gov.cz
- Justice.cz: https://or.justice.cz
- eISIR: https://eisir.justice.cz

## Development

```bash
# Build
pnpm --filter @dxheroes/mcp-byzdata build

# Test
pnpm --filter @dxheroes/mcp-byzdata test
```
