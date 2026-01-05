# Creating Profiles

This guide covers how to create and configure profiles in Local MCP Gateway.

## Before You Start

You can create profiles:
- Without any MCP servers (add later)
- With servers already configured

It's recommended to have at least one server configured first, but not required.

---

## Creating via Web UI

### Step 1: Open Create Dialog

1. Go to `http://localhost:3000/` (Profiles page)
2. Click **"Create Profile"** button

### Step 2: Enter Profile Name

| Requirement | Details |
|-------------|---------|
| Characters | Alphanumeric, dashes (`-`), underscores (`_`) |
| Length | 1-50 characters |
| Uniqueness | Must be unique across all profiles |
| Mutability | **Cannot be changed** after creation |

**Good names**:
- `development`
- `my-tools`
- `team_engineering`
- `prod-readonly`

**Bad names**:
- `My Tools` (spaces not allowed)
- `dev@work` (special characters not allowed)
- Very long descriptive names (hard to type)

### Step 3: Enter Description (Optional)

Description helps identify the profile's purpose:

| Requirement | Details |
|-------------|---------|
| Length | 0-500 characters |
| Format | Plain text |
| Mutability | Can be changed later |

**Good descriptions**:
- "Development tools for backend work"
- "Personal productivity - calendar, email, notes"
- "Read-only production access for debugging"

### Step 4: Select MCP Servers (Optional)

If servers are configured:

1. See list of available servers
2. Check servers to include
3. Note connection status for each

Order matters - servers are checked in order for tool conflicts.

### Step 5: Create

Click **"Create"** to save the profile.

---

## Creating via API

### Endpoint

```
POST /api/profiles
```

### Request Body

```json
{
  "name": "development",
  "description": "Development tools"
}
```

### Response

```json
{
  "id": "uuid-here",
  "name": "development",
  "description": "Development tools",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### Adding Servers via API

```
POST /api/profiles/{id}/servers
```

```json
{
  "mcpServerId": "server-uuid",
  "order": 0
}
```

---

## Naming Conventions

### By Environment

| Profile | Description |
|---------|-------------|
| `development` | Local dev tools |
| `staging` | Staging environment |
| `production` | Prod access (usually read-only) |

### By Team

| Profile | Description |
|---------|-------------|
| `engineering` | Engineering team tools |
| `design` | Design team tools |
| `ops` | Operations tools |

### By Use Case

| Profile | Description |
|---------|-------------|
| `coding` | Code-related tools |
| `personal` | Personal productivity |
| `communication` | Slack, email, etc. |

### By Project

| Profile | Description |
|---------|-------------|
| `project-alpha` | Project Alpha tools |
| `frontend-app` | Frontend project |
| `backend-api` | Backend project |

---

## Best Practices

### Keep Names Short

The profile name becomes part of the URL:

```
/api/mcp/development  ← Easy to type
/api/mcp/development-environment-for-backend-team  ← Too long
```

### Use Consistent Patterns

If you have multiple related profiles:

```
team-engineering
team-design
team-ops
```

Not:
```
engineering-team
design_tools
ops
```

### Choose Names Wisely

Profile names **cannot be changed** after creation. If you need a different name, you must:

1. Create new profile with desired name
2. Assign same servers
3. Update all client configurations
4. Delete old profile

### Use Descriptions

Names are short, descriptions provide context:

- Name: `prod`
- Description: "Production environment - read-only database access, monitoring tools only. Do not use for writes."

---

## What Happens After Creation

### Endpoint Created

Your profile is immediately accessible at:

```
http://localhost:3001/api/mcp/{profile-name}
```

### No Tools Yet

If no servers are assigned:
- Endpoint works but returns empty tool list
- Add servers via Edit to enable tools

### Ready to Use

If servers are assigned:
- Tools are immediately available
- Configure your AI client to use the endpoint

---

## Troubleshooting

### "Name already exists"

Choose a unique name. Check existing profiles.

### "Invalid profile name"

Ensure name only contains:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Dashes (-)
- Underscores (_)

No spaces or special characters.

### "Failed to create"

Check:
1. Backend is running
2. Database is accessible
3. Network connectivity

### Servers not appearing in selection

1. Ensure servers are created first
2. Check MCP Servers page for server list
3. Refresh the page

---

## Next Steps

- [Managing Servers](./managing-servers.md) - Add/remove servers
- [Profile Endpoints](./profile-endpoints.md) - Using the endpoint
- [Integration Guides](../integration/README.md) - Connect AI clients
