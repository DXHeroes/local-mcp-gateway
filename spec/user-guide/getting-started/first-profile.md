# Creating Your First Profile

Profiles are the core concept in Local MCP Gateway. A profile groups multiple MCP servers together and exposes them through a single endpoint.

## What is a Profile?

A profile is:
- A **named collection** of MCP servers
- Accessible via a **single endpoint** (e.g., `/api/mcp/my-profile`)
- **Use-case oriented** (e.g., "development", "personal", "team")

Instead of configuring each MCP server individually in Claude, you configure one profile endpoint.

---

## Creating a Profile via Web UI

### Step 1: Open the Profiles Page

1. Start the gateway: `pnpm dev`
2. Open `http://localhost:3000` in your browser
3. You're now on the Profiles page

### Step 2: Click "Create Profile"

Click the **"Create Profile"** button in the top right.

### Step 3: Fill in Profile Details

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Unique identifier (alphanumeric, dashes, underscores) | `my-dev-tools` |
| **Description** | Optional description of the profile's purpose | `Development tools for coding` |

**Naming rules:**
- Alphanumeric characters, dashes (`-`), and underscores (`_`)
- Maximum 50 characters
- Must be unique
- Cannot be changed after creation

### Step 4: Select MCP Servers (Optional)

If you've already added MCP servers, you can select them here. Otherwise, skip this step and add servers later.

### Step 5: Save

Click **"Create"** to save the profile.

---

## Profile Endpoint

Once created, your profile is accessible at:

```
http://localhost:3001/api/mcp/{profile-name}
```

For example, a profile named `my-dev-tools` is at:

```
http://localhost:3001/api/mcp/my-dev-tools
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mcp/{profile}` | POST | JSON-RPC endpoint for MCP requests |
| `/api/mcp/{profile}/sse` | GET | Server-Sent Events endpoint |
| `/api/mcp/{profile}/info` | GET | Profile metadata (tools, resources) |

---

## Profile Information

Each profile card in the UI shows:

- **Name** and description
- **Server count** - How many MCP servers are assigned
- **Connection status** - How many servers are connected
- **Tool count** - Total tools available
- **Gateway endpoint** - URL to copy for client configuration

---

## Managing Profiles

### Edit a Profile

1. Click **"Edit"** on the profile card
2. Modify description or server assignments
3. Click **"Save"**

Note: Profile name cannot be changed after creation.

### Delete a Profile

1. Click **"Delete"** on the profile card
2. Confirm deletion in the dialog

**Warning**: Deleting a profile also removes all debug logs associated with it.

### Assign Servers

1. Click **"Edit"** on the profile
2. Check/uncheck servers in the server list
3. Click **"Save"**

Server order matters - tools from servers are aggregated in order.

---

## Example: Development Profile

Let's create a profile for development work:

1. **Create profile**:
   - Name: `development`
   - Description: `Tools for software development`

2. **Add servers** (once configured):
   - GitHub MCP server (issue management, PRs)
   - Linear MCP server (project management)
   - Database MCP server (query data)

3. **Configure Claude Desktop**:
   ```json
   {
     "mcpServers": {
       "development": {
         "url": "http://localhost:3001/api/mcp/development"
       }
     }
   }
   ```

4. **Use in Claude**:
   - "Create a GitHub issue for the login bug"
   - "Check my Linear tickets"
   - "Query the users table"

All tools are available through one endpoint!

---

## Best Practices

### Profile Organization

| Profile Name | Use Case | Example Servers |
|--------------|----------|-----------------|
| `personal` | Personal productivity | Calendar, Email, Notes |
| `development` | Software development | GitHub, Linear, Database |
| `team` | Team collaboration | Slack, Notion, shared tools |
| `testing` | Tool testing | Test servers, debug endpoints |

### Naming Conventions

- Use **lowercase** with dashes: `my-profile`
- Be **descriptive**: `frontend-dev` vs `fd`
- Keep it **short**: `dev` vs `development-environment`
- Use **consistent prefixes** for related profiles: `team-engineering`, `team-design`

### Security

- Create separate profiles for different security levels
- Don't mix production and development servers
- Use OAuth for sensitive servers

---

## Next Steps

- [Adding MCP Servers](./first-mcp-server.md) - Add servers to your profile
- [Profile Endpoints](../profiles/profile-endpoints.md) - Detailed endpoint documentation
- [Claude Desktop Integration](../integration/claude-desktop.md) - Connect your profile

---

## Troubleshooting

### "Profile name already exists"

Profile names must be unique. Choose a different name.

### "Invalid profile name"

Names must be alphanumeric with dashes/underscores only. No spaces or special characters.

### Profile not showing tools

1. Make sure servers are assigned to the profile
2. Check that servers are connected (green status)
3. Verify servers have tools configured

See [Troubleshooting Guide](../../reference/troubleshooting.md) for more solutions.
