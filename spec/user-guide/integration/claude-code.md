# Claude Code CLI Integration

Connect Claude Code (the CLI tool) to Local MCP Gateway for terminal-based AI assistance with tools.

## Overview

Claude Code is a command-line interface for Claude that supports MCP servers. It's ideal for developers who prefer terminal workflows.

---

## Prerequisites

- Claude Code CLI installed
- Local MCP Gateway running (`pnpm dev`)
- At least one profile with servers configured

---

## Configuration Methods

### Method 1: Project Configuration

Create an MCP configuration in your project directory.

#### .mcp.json

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

This configuration applies only to this project.

#### .claude/mcp.json

Alternatively, create `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

### Method 2: Global Configuration

For system-wide MCP access, configure in your home directory:

```bash
# Create config directory
mkdir -p ~/.claude

# Create config file
cat > ~/.claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
EOF
```

### Method 3: Environment Variable

Set the gateway URL via environment:

```bash
export MCP_SERVER_URL="http://localhost:3001/api/mcp/my-profile"
```

Add to your shell profile (`.bashrc`, `.zshrc`) for persistence.

---

## Using Claude Code with Tools

### Starting a Session

```bash
# Start Claude Code in current directory
claude

# Or with specific context
claude "Help me debug this function"
```

### Listing Available Tools

```bash
# In Claude Code session
> What tools do you have access to?
```

### Using Tools

```bash
> Create a GitHub issue for the performance bug we found

> Query the database for recent user signups

> Search the codebase for authentication logic
```

### Specifying Profile

If you have multiple profiles configured:

```bash
> For development work, use the development tools
> For personal tasks, use the personal tools
```

---

## Configuration Examples

### Single Profile

```json
{
  "mcpServers": {
    "gateway": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

### Multiple Profiles

```json
{
  "mcpServers": {
    "dev": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "prod": {
      "url": "http://localhost:3001/api/mcp/production"
    },
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "gateway": {
      "url": "${MCP_GATEWAY_URL}/api/mcp/${MCP_PROFILE}"
    }
  }
}
```

Then set:
```bash
export MCP_GATEWAY_URL="http://localhost:3001"
export MCP_PROFILE="development"
```

### Per-Project Profiles

Different projects can use different profiles:

**~/projects/backend/.mcp.json**:
```json
{
  "mcpServers": {
    "tools": {
      "url": "http://localhost:3001/api/mcp/backend-dev"
    }
  }
}
```

**~/projects/frontend/.mcp.json**:
```json
{
  "mcpServers": {
    "tools": {
      "url": "http://localhost:3001/api/mcp/frontend-dev"
    }
  }
}
```

---

## Shell Integration

### Aliases

Add helpful aliases to your shell config:

```bash
# ~/.bashrc or ~/.zshrc

# Claude with development profile
alias claude-dev='MCP_PROFILE=development claude'

# Claude with personal tools
alias claude-personal='MCP_PROFILE=personal claude'

# Quick gateway check
alias mcp-status='curl -s http://localhost:3001/health | jq .'
```

### Functions

```bash
# Function to start Claude with specific profile
claude-with() {
  local profile=$1
  shift
  MCP_SERVER_URL="http://localhost:3001/api/mcp/$profile" claude "$@"
}

# Usage: claude-with development "help me debug this"
```

### Auto-completion

If Claude Code supports completion, tools from the gateway should appear.

---

## Scripting with Tools

### Non-Interactive Usage

```bash
# One-shot command with tool usage
claude --non-interactive "Create a GitHub issue titled 'Bug: Login fails' with label 'bug'"
```

### Piping Content

```bash
# Analyze file with tools
cat error.log | claude "Analyze this error and create a GitHub issue if it's a bug"

# Process output
claude "List open issues" | grep "high priority"
```

### In Scripts

```bash
#!/bin/bash
# create-issue.sh

TITLE="$1"
BODY="$2"

claude --non-interactive "Create a GitHub issue:
Title: $TITLE
Body: $BODY
Labels: from-script"
```

---

## Troubleshooting

### "No MCP servers configured"

1. Check config file exists and has correct syntax
2. Verify config file location:
   - Project: `.mcp.json` or `.claude/mcp.json`
   - Global: `~/.claude/mcp.json`
3. Check file permissions

### "Connection refused"

1. Verify gateway is running:
   ```bash
   curl http://localhost:3001/health
   ```
2. Check URL in config matches gateway address
3. Ensure port 3001 is accessible

### "Tools not working"

1. Check profile has servers assigned
2. Verify tools appear:
   ```bash
   curl http://localhost:3001/api/mcp/my-profile/info | jq .
   ```
3. Check Debug Logs in gateway UI

### Config Not Loading

Priority order for config:
1. `.mcp.json` in current directory
2. `.claude/mcp.json` in current directory
3. `~/.claude/mcp.json` (global)

Check you're in the right directory.

---

## Tips

### Debugging MCP Calls

Keep gateway Debug Logs open while using Claude Code:

```bash
# Terminal 1: Gateway with logs
pnpm dev

# Terminal 2: Claude Code
claude

# Terminal 3 or Browser: Watch debug logs
open http://localhost:3000/debug-logs
```

### Profile Per Task

Create task-specific aliases:

```bash
alias claude-code='claude-with development'
alias claude-write='claude-with personal'
alias claude-review='claude-with team'
```

### Quick Tool Test

Test tools work before a session:

```bash
curl -X POST http://localhost:3001/api/mcp/my-profile \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## See Also

- [Quick Start](../getting-started/quick-start.md) - Gateway setup
- [mcp.json Configuration](./mcp-json-config.md) - Detailed config options
- [Debug Logs](../web-ui/debug-logs-page.md) - Troubleshooting
- [HTTPS Tunneling](./https-tunneling.md) - For remote access
