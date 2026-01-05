# Use Case: Team Collaboration

Share MCP tools across your team with centralized configuration and consistent access.

## Overview

| Aspect | Details |
|--------|---------|
| **Goal** | Unified MCP access for teams |
| **Difficulty** | Intermediate to Advanced |
| **Time** | 1-2 hours |
| **Prerequisites** | Local MCP Gateway, team deployment |

---

## The Challenge

Without centralization, each team member must:
- Configure each MCP server individually
- Manage their own OAuth tokens
- Handle credential rotation
- Troubleshoot independently

This leads to:
- Inconsistent configurations
- Security risks from shared credentials
- Onboarding friction
- No visibility into tool usage

---

## The Solution

Local MCP Gateway provides:
- **Centralized server configuration** - Configure once, share with team
- **Managed authentication** - OAuth and API keys in one place
- **Role-based profiles** - Different tools for different roles
- **Usage visibility** - Debug logs for all team members

---

## Architecture Options

### Option 1: Shared Instance (Recommended for small teams)

```
┌─────────────────┐
│  Team Members   │
│                 │
│  Alice ─────────┼──┐
│  Bob ───────────┼──┼──▶ Single Gateway Instance
│  Carol ─────────┼──┘    http://gateway.internal:3001
│                 │
└─────────────────┘
```

**Pros**: Simple, single configuration
**Cons**: Single point of failure, shared quotas

### Option 2: Gateway per Team (Recommended for large orgs)

```
┌─────────────────┐     ┌─────────────────┐
│  Engineering    │     │  Design Team    │
│                 │     │                 │
│ gateway:3001 ◀──┼─────┼──▶ gateway:3002 │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

**Pros**: Team isolation, independent scaling
**Cons**: More infrastructure

---

## Step 1: Deploy Shared Gateway

### Using Docker

```bash
# Clone and configure
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# Create .env for team deployment
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_PATH=/data/local-mcp-gateway.db
CORS_ORIGINS=http://localhost:3000,https://team-gateway.internal
OAUTH_ENCRYPTION_KEY=your-32-character-secret-key-here
EOF

# Deploy with Docker Compose
docker-compose up -d
```

### Network Configuration

Ensure the gateway is accessible to team members:
- Internal network: `http://gateway.internal:3001`
- VPN access for remote workers
- Consider HTTPS for production

---

## Step 2: Create Role-Based Profiles

### Engineering Profile

1. Create profile:
   - **Name**: `engineering`
   - **Description**: `Tools for engineering team`

2. Add servers:
   - GitHub (repository access)
   - Linear (engineering board)
   - Database (dev/staging)
   - Documentation (internal docs)

### Design Profile

1. Create profile:
   - **Name**: `design`
   - **Description**: `Tools for design team`

2. Add servers:
   - Figma (if MCP available)
   - Linear (design board)
   - Documentation (design system)

### Management Profile

1. Create profile:
   - **Name**: `management`
   - **Description**: `Tools for managers`

2. Add servers:
   - Linear (all boards, read-only)
   - Analytics (dashboards)
   - Calendar

---

## Step 3: Configure Team Credentials

### Shared OAuth Applications

For services like GitHub, create a shared OAuth app:

1. Create OAuth app in GitHub organization settings
2. Configure in gateway for all team members
3. Each user authorizes once via the gateway UI

### Service Accounts

For API keys, use service accounts:

1. Create a service account in each service
2. Generate API key with appropriate permissions
3. Configure in gateway once

### Credential Rotation

When credentials need rotation:

1. Update in gateway MCP server settings
2. All team members automatically use new credentials
3. No individual configuration needed

---

## Step 4: Distribute Configuration

Share the gateway URL with team members:

### Claude Desktop Config

```json
{
  "mcpServers": {
    "team-tools": {
      "url": "http://gateway.internal:3001/api/mcp/engineering"
    }
  }
}
```

### Cursor IDE

Team members add to their Cursor settings:
```
http://gateway.internal:3001/api/mcp/engineering
```

### Documentation

Create internal documentation with:
- Gateway URL
- Available profiles and their purpose
- Setup instructions for each IDE
- Troubleshooting guide

---

## Step 5: Onboarding New Members

### Automated Onboarding

Create an onboarding script:

```bash
#!/bin/bash
# onboard-mcp.sh

# Determine user's role
read -p "Enter your role (engineering/design/management): " ROLE

# Configure Claude Desktop
CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "team-tools": {
      "url": "http://gateway.internal:3001/api/mcp/$ROLE"
    }
  }
}
EOF

echo "Configuration complete! Restart Claude Desktop."
```

### Self-Service Authorization

For OAuth-based servers:

1. New team member opens gateway UI
2. Navigates to MCP Servers
3. Clicks "Authorize" on servers requiring OAuth
4. Completes OAuth flow with their account
5. Gateway stores token for their use

---

## Managing Team Access

### Access Levels

Consider creating multiple access levels:

| Profile | Access Level | Who |
|---------|--------------|-----|
| `engineering-full` | Full write access | Senior engineers |
| `engineering-read` | Read-only | Junior engineers, contractors |
| `design` | Design tools | Design team |
| `management` | Reports only | Managers |

### Monitoring Usage

Use debug logs to monitor:

1. Go to **"Debug Logs"** in gateway UI
2. Filter by profile to see team usage
3. Identify popular tools
4. Find error patterns

### Audit Trail

Debug logs provide:
- Who called which tools
- Request parameters
- Response data
- Error messages
- Timing information

---

## Security Considerations

### Network Security

- Deploy gateway on internal network only
- Use HTTPS for production
- Consider VPN for remote access
- Implement IP allowlisting if needed

### Credential Security

- Use OAuth when possible (individual tokens)
- Rotate API keys regularly
- Encrypt tokens at rest (OAUTH_ENCRYPTION_KEY)
- Limit scope of credentials

### Access Control

Current limitations:
- No per-user authentication on gateway
- All users with network access can use any profile

Future considerations:
- Add gateway authentication
- Integrate with SSO
- Role-based access control

### Monitoring

- Monitor gateway logs for unusual activity
- Set up alerts for error rates
- Track tool usage patterns

---

## Scaling Considerations

### Performance

For larger teams:
- Deploy multiple gateway instances
- Use load balancer
- Configure higher rate limits
- Monitor resource usage

### High Availability

For critical deployments:
- Run multiple instances
- Use shared database (PostgreSQL instead of SQLite)
- Implement health checks
- Configure automatic failover

---

## Troubleshooting

### Team member can't connect

1. Verify network access to gateway
2. Check profile URL is correct
3. Ensure gateway is running
4. Check firewall rules

### OAuth not working for some users

1. Each user must authorize individually
2. Check OAuth app has correct permissions
3. Verify redirect URLs include gateway

### Rate limiting issues

1. Check if team is hitting external API limits
2. Consider caching strategies
3. Spread usage across multiple API keys
4. Contact service providers for higher limits

---

## Best Practices

### Documentation

- Maintain internal wiki with gateway details
- Document which tools are available in each profile
- Create troubleshooting runbook

### Communication

- Announce gateway maintenance windows
- Notify team of new tools added
- Collect feedback on tool usefulness

### Iteration

- Review usage logs monthly
- Remove unused servers
- Add requested integrations
- Update configurations as needed

---

## Next Steps

- [Debugging MCP Traffic](./debugging-mcp-traffic.md) - Monitor team usage
- [Deployment Guide](../../technical/deployment/docker.md) - Production deployment
- [Security Model](../../technical/architecture/security-model.md) - Security details
