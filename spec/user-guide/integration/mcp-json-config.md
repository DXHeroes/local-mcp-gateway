# mcp.json Configuration Reference

The `mcp.json` format is used by multiple MCP clients. This guide covers all configuration options.

## File Locations

Different clients look for config in different places:

| Client | Locations (in order) |
|--------|---------------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| Claude Code | `.mcp.json`, `.claude/mcp.json`, `~/.claude/mcp.json` |
| Cursor | `.cursor/mcp.json`, Cursor settings |

---

## Basic Structure

```json
{
  "mcpServers": {
    "server-name": {
      "url": "http://localhost:3001/api/mcp/profile"
    }
  }
}
```

### Multiple Servers

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    },
    "production": {
      "url": "http://localhost:3001/api/mcp/production"
    }
  }
}
```

---

## Server Configuration Options

### URL (Required)

The MCP endpoint URL:

```json
{
  "mcpServers": {
    "my-server": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

### Headers (Optional)

Custom headers for requests:

```json
{
  "mcpServers": {
    "my-server": {
      "url": "http://localhost:3001/api/mcp/my-profile",
      "headers": {
        "Authorization": "Bearer token123",
        "X-Custom-Header": "value"
      }
    }
  }
}
```

### Transport (Optional)

Specify transport type (usually auto-detected):

```json
{
  "mcpServers": {
    "http-server": {
      "url": "http://localhost:3001/api/mcp/profile",
      "transport": "http"
    },
    "sse-server": {
      "url": "http://localhost:3001/api/mcp/profile/sse",
      "transport": "sse"
    }
  }
}
```

---

## Environment Variables

### In URL

Use environment variables in URLs:

```json
{
  "mcpServers": {
    "gateway": {
      "url": "${MCP_GATEWAY_URL}/api/mcp/${MCP_PROFILE}"
    }
  }
}
```

Set in your shell:
```bash
export MCP_GATEWAY_URL="http://localhost:3001"
export MCP_PROFILE="development"
```

### In Headers

```json
{
  "mcpServers": {
    "gateway": {
      "url": "http://localhost:3001/api/mcp/profile",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

---

## Complete Examples

### Development Setup

```json
{
  "mcpServers": {
    "dev": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

### Multi-Environment Setup

```json
{
  "mcpServers": {
    "dev": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "staging": {
      "url": "https://staging-gateway.internal/api/mcp/staging"
    },
    "prod": {
      "url": "https://gateway.internal/api/mcp/production",
      "headers": {
        "X-Environment": "production"
      }
    }
  }
}
```

### Team Setup

```json
{
  "mcpServers": {
    "engineering": {
      "url": "http://gateway.internal:3001/api/mcp/engineering"
    },
    "design": {
      "url": "http://gateway.internal:3001/api/mcp/design"
    },
    "shared": {
      "url": "http://gateway.internal:3001/api/mcp/shared"
    }
  }
}
```

### With HTTPS Tunnel

```json
{
  "mcpServers": {
    "tools": {
      "url": "https://my-gateway.loca.lt/api/mcp/my-profile"
    }
  }
}
```

### Mixed Direct and Gateway

```json
{
  "mcpServers": {
    "gateway-tools": {
      "url": "http://localhost:3001/api/mcp/development"
    },
    "direct-server": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

---

## Gateway URL Patterns

### Profile Endpoint (HTTP)

Main endpoint for JSON-RPC requests:
```
http://localhost:3001/api/mcp/{profile-name}
```

### SSE Endpoint

For Server-Sent Events transport:
```
http://localhost:3001/api/mcp/{profile-name}/sse
```

### Info Endpoint

Get profile metadata (tools, resources):
```
http://localhost:3001/api/mcp/{profile-name}/info
```

---

## Naming Conventions

### Server Names

The server name (key in `mcpServers`) should be:
- Descriptive: `github-tools`, `dev-database`
- Short: `dev`, `prod`, `team`
- Consistent: Use same names across team

### Profile Names

Gateway profile names should match:
- Environment: `development`, `staging`, `production`
- Team: `engineering`, `design`, `ops`
- Use case: `coding`, `personal`, `shared`

---

## Configuration Inheritance

Some clients support inheritance or merging:

### Project Overrides Global

```
~/.claude/mcp.json (global)
├── development server
└── personal server

./project/.mcp.json (project)
├── project-specific server
└── overrides development server
```

### Merging Behavior

- Project config typically overrides global
- Same-named servers are replaced, not merged
- Additional servers are added

---

## Validation

### Check JSON Syntax

```bash
# Using jq
cat mcp.json | jq .

# Using Node.js
node -e "console.log(JSON.parse(require('fs').readFileSync('mcp.json')))"
```

### Common Errors

**Invalid JSON**:
```json
{
  "mcpServers": {
    "server": {
      "url": "http://localhost:3001/api/mcp/profile",  // Comments not allowed
    }  // Trailing comma not allowed
  }
}
```

**Fixed**:
```json
{
  "mcpServers": {
    "server": {
      "url": "http://localhost:3001/api/mcp/profile"
    }
  }
}
```

---

## Troubleshooting

### Config not loading

1. Check file location matches client expectations
2. Verify JSON syntax is valid
3. Restart client after changes
4. Check file permissions

### Wrong server used

1. Check server name matches what you expect
2. Verify no duplicate names across config files
3. Check for typos in server names

### Environment variables not expanding

1. Verify variable is exported: `echo $VAR_NAME`
2. Check client supports env vars in config
3. Try hardcoding to test

---

## See Also

- [Claude Desktop Integration](./claude-desktop.md)
- [Claude Code Integration](./claude-code.md)
- [Cursor Integration](./cursor-ide.md)
- [HTTPS Tunneling](./https-tunneling.md)
