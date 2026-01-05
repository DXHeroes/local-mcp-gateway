# Use Case: Personal AI Assistant

Transform Claude into a personal productivity assistant that can manage your calendar, handle emails, organize notes, and work with your files.

## Overview

| Aspect | Details |
|--------|---------|
| **Goal** | Create a personal AI assistant for daily tasks |
| **Difficulty** | Beginner |
| **Time** | 15-30 minutes |
| **Prerequisites** | Local MCP Gateway running |

---

## What You'll Build

A `personal` profile with access to:

- **Calendar** - View and manage events
- **Email** - Read and draft emails
- **Notes** - Access your note-taking system
- **Files** - Read and organize local files

---

## Step 1: Create the Personal Profile

1. Open the web UI at `http://localhost:3000`
2. Click **"Create Profile"**
3. Configure:
   - **Name**: `personal`
   - **Description**: `Personal productivity assistant`
4. Click **"Create"**

---

## Step 2: Add Calendar Server

For Google Calendar:

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Google Calendar`
   - **Type**: Remote HTTP
   - **URL**: (Your Google Calendar MCP server URL)
3. Configure OAuth:
   - **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
   - **Token URL**: `https://oauth2.googleapis.com/token`
   - **Client ID**: (Your OAuth client ID)
   - **Scopes**: `https://www.googleapis.com/auth/calendar`
4. Click **"Create"**

### Available Calendar Tools

Once connected, Claude can:

| Tool | What it does |
|------|--------------|
| `list_events` | Show upcoming events |
| `create_event` | Schedule new events |
| `update_event` | Modify existing events |
| `delete_event` | Remove events |

---

## Step 3: Add Email Server

For Gmail:

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Gmail`
   - **Type**: Remote HTTP
   - **URL**: (Your Gmail MCP server URL)
3. Configure OAuth:
   - **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
   - **Token URL**: `https://oauth2.googleapis.com/token`
   - **Client ID**: (Your OAuth client ID)
   - **Scopes**: `https://www.googleapis.com/auth/gmail.modify`
4. Click **"Create"**

### Available Email Tools

| Tool | What it does |
|------|--------------|
| `list_emails` | Show recent emails |
| `read_email` | View email content |
| `send_email` | Send new emails |
| `draft_email` | Create email drafts |
| `search_emails` | Find specific emails |

---

## Step 4: Add Notes Server

For a local notes system:

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Notes`
   - **Type**: External Stdio (for local) or Remote HTTP (for cloud)
   - Configure according to your notes system
3. Click **"Create"**

### Available Notes Tools

| Tool | What it does |
|------|--------------|
| `list_notes` | Show all notes |
| `read_note` | View note content |
| `create_note` | Create new notes |
| `search_notes` | Find notes by content |

---

## Step 5: Add File Server

For local file access:

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Files`
   - **Type**: External Stdio
   - Configure the filesystem MCP server
3. Click **"Create"**

### Available File Tools

| Tool | What it does |
|------|--------------|
| `read_file` | Read file contents |
| `list_directory` | Browse folders |
| `search_files` | Find files by name/content |

---

## Step 6: Assign Servers to Profile

1. Go to **"Profiles"**
2. Click **"Edit"** on the `personal` profile
3. Check all the servers you added:
   - Google Calendar
   - Gmail
   - Notes
   - Files
4. Click **"Save"**

---

## Step 7: Configure Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "personal": {
      "url": "http://localhost:3001/api/mcp/personal"
    }
  }
}
```

Restart Claude Desktop.

---

## Using Your Personal Assistant

### Example Prompts

**Calendar**:
- "What meetings do I have today?"
- "Schedule a dentist appointment for next Tuesday at 2pm"
- "Move my 3pm meeting to 4pm"
- "What's my week looking like?"

**Email**:
- "Show me unread emails from today"
- "Draft a reply to John's email about the project"
- "Find emails about the Q4 budget"
- "Send a follow-up to yesterday's meeting attendees"

**Notes**:
- "Create a note with today's meeting action items"
- "What notes do I have about Project X?"
- "Add this to my ideas note"

**Files**:
- "What's in my Downloads folder?"
- "Find the presentation I was working on last week"
- "Read the contents of report.pdf"

**Combined**:
- "Check my calendar for tomorrow and summarize any emails about those meetings"
- "Create a note summarizing my unread emails"
- "Find all files related to Project X and list upcoming meetings about it"

---

## Security Considerations

### OAuth Scopes

Use minimal required scopes:

| Service | Minimal Scope |
|---------|---------------|
| Google Calendar | `calendar.readonly` (read-only) or `calendar` (full) |
| Gmail | `gmail.readonly` (read-only) or `gmail.modify` (full) |

### File Access

For the filesystem server:
- Limit to specific directories
- Avoid access to sensitive folders (`.ssh`, credentials, etc.)
- Consider read-only access

### Data Privacy

- All data stays local (runs on your machine)
- OAuth tokens stored in local database
- No data sent to external services (except the MCP servers themselves)

---

## Troubleshooting

### Calendar not syncing

1. Check OAuth token hasn't expired
2. Re-authorize via **"View Details"** → **"Authorize"**
3. Verify scopes include calendar access

### Email tools not working

1. Gmail may require "Less secure app access" or App Passwords
2. Check OAuth scopes include email permissions
3. Verify MCP server is running

### Files not accessible

1. Check file paths are correct
2. Verify MCP server has file system permissions
3. Ensure directories are within allowed paths

---

## Next Steps

- [Development Workflow](./development-workflow.md) - Add coding tools
- [OAuth Setup](../authentication/oauth-setup.md) - Detailed OAuth configuration
- [Debug Logs](../web-ui/debug-logs-page.md) - Monitor tool usage
