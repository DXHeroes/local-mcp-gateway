# Profiles Page

The Profiles page is the main dashboard for managing your MCP profiles.

## Overview

Access at: `http://localhost:3000/` (home page)

The page displays:
- All profiles in a responsive grid
- Status indicators for each profile
- Quick actions for management
- Gateway endpoint URLs

---

## Profile Cards

Each profile is displayed as a card containing:

### Header Section

- **Profile name** - Unique identifier
- **Description** - Optional description text
- **Actions** - Edit and Delete buttons

### Status Section

- **Server count** - "X of Y servers connected"
- **Tool count** - Total tools available across all servers
- **Status indicators** - Visual connection status

### Gateway Endpoint

- **URL** - Full endpoint URL for the profile
- **Copy button** - One-click copy to clipboard

### AI Prompt Section (Expandable)

- **Expand button** - Show/hide prompt section
- **Generated prompt** - TOON-formatted prompt for AI
- **Copy button** - Copy prompt to clipboard

---

## Creating a Profile

### Step 1: Click Create Profile

Click the **"Create Profile"** button in the top-right corner.

### Step 2: Fill the Form

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Unique identifier (alphanumeric, dashes, underscores) |
| Description | No | Human-readable description |
| Servers | No | MCP servers to include |

### Step 3: Select Servers

If MCP servers are configured:
- Check the servers you want to include
- Servers are listed with their connection status
- Order matters (first server's tools take priority)

### Step 4: Create

Click **"Create"** to save the profile.

---

## Editing a Profile

### Step 1: Click Edit

Click the **"Edit"** button on the profile card.

### Step 2: Modify Settings

You can change:
- **Description** - Update the description
- **Servers** - Add or remove servers

Note: **Name cannot be changed** after creation.

### Step 3: Save

Click **"Save"** to apply changes.

---

## Deleting a Profile

### Step 1: Click Delete

Click the **"Delete"** button on the profile card.

### Step 2: Confirm

A confirmation dialog appears. Click **"Delete"** to confirm.

### What Gets Deleted

- The profile itself
- Profile-server associations
- Debug logs for this profile

### What's Preserved

- MCP servers (they can be used by other profiles)
- OAuth tokens (stored per server, not per profile)

---

## Gateway Endpoint

Each profile has a unique gateway endpoint:

```
http://localhost:3001/api/mcp/{profile-name}
```

### Copying the Endpoint

1. Find the **Gateway Endpoint** section on the profile card
2. Click the **copy icon** (📋)
3. Paste into your MCP client configuration

### Endpoint Variations

| Endpoint | Purpose |
|----------|---------|
| `/api/mcp/{profile}` | Main JSON-RPC endpoint |
| `/api/mcp/{profile}/sse` | Server-Sent Events endpoint |
| `/api/mcp/{profile}/info` | Profile metadata (tools list) |

---

## AI Prompt Generation

The gateway can generate prompts describing available tools.

### Viewing the Prompt

1. Find the **AI Prompt** section on the profile card
2. Click to expand
3. View the generated prompt

### Prompt Contents

The generated prompt includes:
- Profile name and endpoint URL
- List of all available tools
- Tool descriptions and parameters
- TOON format for efficient encoding

### Copying the Prompt

1. Expand the AI Prompt section
2. Click **"Copy Prompt"**
3. Paste into your AI conversation

### Use Case

Use the prompt to quickly inform an AI about available tools without manual listing.

---

## Server Status

### Status Indicators

Each profile shows server connection status:

| Indicator | Meaning |
|-----------|---------|
| "3 of 3 connected" | All servers working |
| "2 of 3 connected" | Some servers have issues |
| "0 of 3 connected" | All servers failing |

### Checking Individual Servers

Click **"Edit"** to see which specific servers are having issues (status shown next to each server).

### Refreshing Status

Status is checked when:
- Page loads
- After editing a profile
- Manually via browser refresh

---

## Tool Count

The tool count shows total tools available through the profile:

- Aggregates tools from all assigned servers
- Includes prefixed tools (when name conflicts exist)
- Updates when servers are added/removed

### Viewing Tools

To see individual tools:
1. Go to **MCP Servers** page
2. Click **"View Details"** on a server
3. See the full tool list

---

## Filtering and Sorting

Currently, profiles are:
- Sorted by creation date (newest first)
- Not filterable

For large numbers of profiles, use browser find (Ctrl/Cmd + F).

---

## Troubleshooting

### "Failed to load profiles"

1. Check gateway backend is running
2. Verify frontend can reach backend (CORS)
3. Check browser console for errors

### Profile shows 0 tools

1. Verify servers are assigned to profile
2. Check servers are connected
3. View server details to confirm tools exist

### Can't create profile

1. Check name is unique
2. Verify name format (alphanumeric, dashes, underscores)
3. Ensure name is under 50 characters

### Edit button doesn't work

1. Check for JavaScript errors in console
2. Try refreshing the page
3. Verify backend is responsive

---

## See Also

- [Creating Profiles](../profiles/creating-profiles.md) - Detailed guide
- [Profile Endpoints](../profiles/profile-endpoints.md) - Endpoint details
- [MCP Servers Page](./mcp-servers-page.md) - Server management
