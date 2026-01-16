# Gemini Deep Research Source Directory

## Description

Source code for the Gemini Deep Research MCP server. Provides AI-powered deep research capabilities using Google's Gemini API.

## Contents

- `index.ts` - Main entry point, exports McpPackage interface
- `server.ts` - MCP server implementation with tool definitions
- `gemini-client.ts` - Google Gemini API client wrapper

## Key Concepts

- **McpPackage Interface**: Required export for auto-discovery
- **Gemini API**: Uses Google's Gemini model for research
- **Tool Definition**: Defines `deep_research` tool for AI clients
- **API Key**: Requires `GEMINI_API_KEY` environment variable

## MCP Tools

- `deep_research` - Performs comprehensive research on a topic using Gemini
