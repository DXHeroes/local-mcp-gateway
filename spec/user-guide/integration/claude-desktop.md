# Claude Desktop Integration

Connect Claude Desktop to Local MCP Gateway for access to all your MCP tools.

## Overview

Claude Desktop is Anthropic's official desktop application. It supports MCP natively through a JSON configuration file.

---

## Prerequisites

- Claude Desktop installed ([Download](https://claude.ai/download))
- Local MCP Gateway running (`pnpm dev`)
- At least one profile with servers configured

---

## Configuration

### Step 1: Locate Config File

The configuration file location varies by operating system:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Step 2: Create/Edit Config

If the file doesn't exist, create it. Add your gateway profile:

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

Replace `my-profile` with your actual profile name.

### Step 3: Restart Claude Desktop

**Important**: You must completely restart Claude Desktop for changes to take effect.

- macOS: Quit from menu bar icon, then reopen
- Windows: Close from system tray, then reopen

### Step 4: Verify Connection

1. Open Claude Desktop
2. Start a new conversation
3. Look for tools in the tools menu (🔧 icon)
4. Or ask Claude: "What tools do you have available?"

---

## Configuration Options

### Single Profile

Basic setup with one profile:

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

### Multiple Profiles

Access different tool sets:

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    },
    "team": {
      "url": "http://localhost:3001/api/mcp/team"
    }
  }
}
```

All profiles are available simultaneously in Claude.

### With Custom Headers

If your gateway requires authentication (future feature):

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

### HTTPS (with tunnel)

For OAuth flows that require HTTPS:

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "https://your-tunnel.loca.lt/api/mcp/my-profile"
    }
  }
}
```

See [HTTPS Tunneling](./https-tunneling.md) for setup.

---

## Using Tools in Claude

### Discovering Tools

Ask Claude what tools are available:

```
What tools do you have access to?
```

Claude will list all tools from your profile.

### Using Tools

Just ask Claude to do things:

```
Create a GitHub issue for the bug we discussed
```

```
Show me my calendar for tomorrow
```

```
Query the users table for recent signups
```

Claude will automatically use the appropriate tools.

### Tool Names with Prefixes

If your profile has multiple servers with same-named tools, they'll be prefixed:

- `github:search` - Search from GitHub server
- `docs:search` - Search from Docs server

Claude handles this automatically, but you can be specific:

```
Use github:search to find issues about authentication
```

---

## Troubleshooting

### "No tools available"

1. **Check gateway is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verify profile endpoint**:
   ```bash
   curl http://localhost:3001/api/mcp/my-profile/info
   ```
   Should return JSON with tools.

3. **Check config file syntax**:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   ```
   Ensure valid JSON.

4. **Restart Claude Desktop** completely.

### "Connection refused"

1. Gateway isn't running - start with `pnpm dev`
2. Wrong port - default is 3001
3. Check the profile name in URL matches exactly

### "Tools list but don't work"

1. Check Debug Logs in gateway UI for errors
2. Verify server authentication (OAuth/API keys)
3. Look for error messages in tool responses

### Config file not found

Create the directory and file:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows (PowerShell)
mkdir -Force $env:APPDATA\Claude
New-Item $env:APPDATA\Claude\claude_desktop_config.json

# Linux
mkdir -p ~/.config/Claude
touch ~/.config/Claude/claude_desktop_config.json
```

### Changes not taking effect

Claude Desktop caches config on startup. You must:

1. Fully quit Claude Desktop (not just close window)
2. On macOS, quit from the menu bar icon
3. On Windows, exit from system tray
4. Reopen Claude Desktop

---

## Tips

### Quick Profile Switching

Configure multiple profiles and tell Claude which to use:

```
For this conversation, let's use the development tools.
```

### Viewing Tool Schemas

To see what parameters a tool accepts:

```
Show me the parameters for the github_create_issue tool
```

### Debugging Requests

While using Claude, keep the gateway's Debug Logs page open to see requests in real-time.

### Local Development

For developing MCP servers:

1. Create a `testing` profile
2. Add your dev server
3. Iterate and test via Claude

---

## Example Workflow

1. Start gateway: `pnpm dev`
2. Create profile with servers you need
3. Add to Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "my-workflow": {
         "url": "http://localhost:3001/api/mcp/my-workflow"
       }
     }
   }
   ```
4. Restart Claude Desktop
5. Start chatting with tool access!

---

## See Also

- [Quick Start](../getting-started/quick-start.md) - Gateway setup
- [Creating Profiles](../profiles/creating-profiles.md) - Profile configuration
- [HTTPS Tunneling](./https-tunneling.md) - For OAuth flows
- [Debug Logs](../web-ui/debug-logs-page.md) - Troubleshooting
