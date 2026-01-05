# Cursor IDE Integration

Connect Cursor IDE to Local MCP Gateway for AI-powered coding with access to your tools.

## Overview

Cursor is an AI-first code editor that supports MCP servers. Integrating with Local MCP Gateway gives Cursor access to all your aggregated tools.

---

## Prerequisites

- Cursor IDE installed ([Download](https://cursor.sh/))
- Local MCP Gateway running (`pnpm dev`)
- At least one profile with servers configured

---

## Configuration

### Method 1: Settings UI

1. Open Cursor
2. Go to **Settings** (Cmd/Ctrl + ,)
3. Search for "MCP" or navigate to MCP settings
4. Add server configuration:
   - **Name**: `my-tools`
   - **URL**: `http://localhost:3001/api/mcp/my-profile`

### Method 2: Settings JSON

1. Open Cursor
2. Open Command Palette (Cmd/Ctrl + Shift + P)
3. Type "Open Settings (JSON)"
4. Add MCP configuration:

```json
{
  "mcp.servers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

### Method 3: Project Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "project-tools": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

This configuration applies only to this project.

---

## Configuration Examples

### Single Profile

```json
{
  "mcp.servers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

### Multiple Profiles

```json
{
  "mcp.servers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    }
  }
}
```

### Project-Specific

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "backend-tools": {
      "url": "http://localhost:3001/api/mcp/backend"
    }
  }
}
```

---

## Using Tools in Cursor

### Chat with Tools

Open the AI Chat panel (Cmd/Ctrl + L) and ask Claude to use tools:

```
Create a GitHub issue for the bug in this file

Search Linear for related tickets

Query the database for test data
```

### Inline Assistance

When using inline AI (Cmd/Ctrl + K), tools are available:

```
// Generate test data using the database tool
```

### Code Context

Cursor automatically provides code context. Combined with gateway tools:

```
Look at this function and create a GitHub issue
for the performance problem I've highlighted
```

---

## Project Workflows

### Per-Project Profiles

Different projects can use different gateway profiles:

**Frontend Project** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "tools": {
      "url": "http://localhost:3001/api/mcp/frontend-dev"
    }
  }
}
```

**Backend Project** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "tools": {
      "url": "http://localhost:3001/api/mcp/backend-dev"
    }
  }
}
```

### Monorepo Setup

For monorepos, use a shared profile:

```json
{
  "mcpServers": {
    "monorepo-tools": {
      "url": "http://localhost:3001/api/mcp/monorepo"
    }
  }
}
```

---

## Example Use Cases

### Issue Management

```
Create a GitHub issue:
- Title: Fix authentication timeout
- Body: Users are getting logged out after 5 minutes
- Labels: bug, auth
- Assign to me
```

### Database Queries

```
Query the users table and show me:
- Users who signed up this week
- Their subscription status
- Order by signup date
```

### Code Search

```
Search GitHub for how we handle rate limiting
in the API codebase
```

### Documentation

```
Find documentation about the payment processing flow
```

### Combined Workflows

```
1. Find issues labeled 'bug' in GitHub
2. Check if there are related Linear tickets
3. Create a summary of what needs to be fixed
```

---

## Troubleshooting

### Tools not appearing

1. **Verify gateway is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check Cursor settings**:
   - Open Settings → Search "MCP"
   - Verify server URL is correct

3. **Restart Cursor**:
   - Fully quit and reopen

4. **Check profile has tools**:
   ```bash
   curl http://localhost:3001/api/mcp/my-profile/info
   ```

### "Connection refused"

1. Gateway not running → Start with `pnpm dev`
2. Wrong URL → Check matches gateway address
3. Firewall blocking → Allow localhost:3001

### Tools fail with errors

1. Open gateway Debug Logs
2. Find the failing request
3. Check error message
4. Verify authentication (OAuth/API keys)

### Config not loading

1. Check file location:
   - Global: Cursor settings
   - Project: `.cursor/mcp.json`
2. Verify JSON syntax
3. Restart Cursor after changes

---

## Tips

### Real-time Debugging

Open gateway Debug Logs in a browser while working in Cursor to see tool calls in real-time.

### Quick Profile Switch

Configure multiple profiles and specify in chat:

```
Using the production profile, check the error logs
```

### Combine with Code Context

Cursor excels at providing code context:

```
[Select code]
This function is slow. Query the database to check
if there's missing indexes on the users table.
```

### Keyboard Shortcuts

- **Cmd/Ctrl + L**: Open AI Chat
- **Cmd/Ctrl + K**: Inline AI
- **Cmd/Ctrl + Shift + L**: Chat with selection

---

## Best Practices

### Development Profile

Create a development profile with:
- GitHub (issue tracking)
- Database (dev/staging only)
- Documentation search
- Internal tools

### Safety

- Use read-only database access
- Separate dev/prod profiles
- Review tool calls in Debug Logs

### Performance

- Keep profiles focused (don't add unused servers)
- Monitor tool response times
- Use caching where available

---

## See Also

- [Quick Start](../getting-started/quick-start.md) - Gateway setup
- [Creating Profiles](../profiles/creating-profiles.md) - Profile configuration
- [Debug Logs](../web-ui/debug-logs-page.md) - Troubleshooting
- [mcp.json Configuration](./mcp-json-config.md) - Configuration details
