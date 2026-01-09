# Gemini Deep Research MCP Package

## Purpose

MCP server that provides comprehensive AI-powered research capabilities using **Google Gemini AI**. Delivers structured, well-organized outputs with key findings, analysis, and conclusions.

## Package Info

- **ID**: `gemini-deep-research`
- **Name**: Gemini Deep Research
- **Version**: 1.0.0
- **Requires API Key**: Yes (Google AI Studio)

## Structure

```
gemini-deep-research/
├── src/
│   ├── index.ts              # McpPackage export
│   ├── server.ts             # MCP server implementation
│   └── gemini-client.ts      # Google Gemini API client
├── __tests__/                # Unit tests
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── AGENTS.md                 # This file
```

## Tools Provided

### `deep_research`

Conducts comprehensive research on any topic.

**Input Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | Yes | Research topic or question (max 2000 chars) |
| `depth` | enum | No | `quick` (5-10 points), `standard` (15-20), `comprehensive` |
| `outputFormat` | enum | No | `markdown`, `structured`, `outline` |
| `focusAreas` | string[] | No | Specific areas to focus on |

**Example:**
```json
{
  "name": "deep_research",
  "arguments": {
    "topic": "Impact of AI on software development productivity",
    "depth": "standard",
    "outputFormat": "markdown",
    "focusAreas": ["code generation", "testing", "documentation"]
  }
}
```

## API Key Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. In the UI: MCP Servers > Gemini Deep Research > Configure API Key
4. Paste your API key

**API Key Config:**
- Header: `x-goog-api-key`
- Format: `{apiKey}` (no Bearer prefix)

## Error Responses

| Error Code | Description |
|------------|-------------|
| `API_KEY_REQUIRED` | API key not configured |
| `INVALID_API_KEY` | API key is invalid or expired |
| `RATE_LIMITED` | Too many requests, wait and retry |
| `INVALID_INPUT` | Input validation failed |
| `RESEARCH_FAILED` | Research request failed |
| `UNKNOWN_TOOL` | Unknown tool name |

## Seed Configuration

Automatically added to `default` profile:
- Order: 1 (first position)
- Active: true

## Development

```bash
# Build
pnpm --filter @dxheroes/mcp-gemini-deep-research build

# Test
pnpm --filter @dxheroes/mcp-gemini-deep-research test

# Clean
pnpm --filter @dxheroes/mcp-gemini-deep-research clean
```

## Dependencies

- `@google/generative-ai` - Google AI SDK
- `zod` - Input validation
- `@dxheroes/local-mcp-core` (peer) - Core abstractions

## Related Files

- **MCP Servers Guide**: `mcp-servers/AGENTS.md`
- **Core Types**: `packages/core/src/types/mcp-package.ts`
- **McpServer Base**: `packages/core/src/abstractions/McpServer.ts`
