# Gemini Deep Research MCP Package

## Purpose

MCP server that provides comprehensive AI-powered research capabilities using **Google Gemini AI**. Delivers structured, well-organized outputs with key findings, analysis, and conclusions.

## Package Info

- **ID**: `gemini-deep-research`
- **Name**: Gemini Deep Research
- **Version**: 0.4.3
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

Conducts comprehensive research on any topic using Google's Deep Research Agent.

**Input Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | Yes | Research topic or question (max 10000 chars) |
| `formatInstructions` | string | No | Optional formatting instructions for the output |

**Example:**
```json
{
  "name": "deep_research",
  "arguments": {
    "topic": "Impact of AI on software development productivity",
    "formatInstructions": "Format as a technical report with: 1. Executive Summary, 2. Key Findings, 3. Conclusions"
  }
}
```

### `deep_research_followup`

Ask a follow-up question about a completed research.

**Input Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `interactionId` | string | Yes | Interaction ID from a previous deep_research call |
| `question` | string | Yes | Follow-up question (max 2000 chars) |

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

- `@google/genai` - Google GenAI SDK
- `zod` - Input validation
- `@dxheroes/local-mcp-core` (peer) - Core abstractions

## Child Directories

- **[src/AGENTS.md](src/AGENTS.md)** - Source code documentation

## Related Files

- **MCP Servers Guide**: `mcp-servers/AGENTS.md`
- **Core Types**: `packages/core/src/types/mcp-package.ts`
- **McpServer Base**: `packages/core/src/abstractions/McpServer.ts`
