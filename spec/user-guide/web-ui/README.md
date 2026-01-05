# Web UI Guide

The Local MCP Gateway web interface provides a visual way to manage profiles, MCP servers, and monitor activity.

## Accessing the UI

Start the gateway and open the frontend:

```bash
pnpm dev
# Opens at http://localhost:3000
```

---

## Navigation

The main navigation bar provides access to all sections:

| Section | URL | Description |
|---------|-----|-------------|
| **Profiles** | `/` | Manage profiles (home page) |
| **MCP Servers** | `/mcp-servers` | Manage MCP servers |
| **Debug Logs** | `/debug-logs` | View request/response logs |

---

## Pages Overview

### [Profiles Page](./profiles-page.md)

The home page for managing profiles:

- View all profiles with status
- Create, edit, delete profiles
- Assign MCP servers to profiles
- Copy gateway endpoints
- Generate AI prompts

### [MCP Servers Page](./mcp-servers-page.md)

Manage your MCP server connections:

- View all configured servers
- Add new servers (HTTP, SSE, Stdio, Custom)
- Configure authentication
- Check connection status
- View available tools

### [Server Detail Page](./server-detail-page.md)

Deep dive into individual servers:

- View full configuration
- See all available tools
- Check connection status
- View server-specific logs

### [Debug Logs Page](./debug-logs-page.md)

Monitor MCP traffic:

- Filter by profile, server, type, status
- View request/response payloads
- Track timing and errors
- Debug integration issues

---

## Quick Actions

### Create Profile

1. Click **"Create Profile"** on Profiles page
2. Enter name and description
3. Select MCP servers
4. Click **"Create"**

### Add MCP Server

1. Go to **MCP Servers** page
2. Click **"Add MCP Server"**
3. Configure type, URL, authentication
4. Click **"Create"**

### Copy Endpoint

1. Find your profile on Profiles page
2. Click the **copy** icon next to gateway endpoint
3. Paste into your MCP client config

### Debug a Request

1. Go to **Debug Logs** page
2. Filter by profile or server
3. Click a log entry to expand
4. View request/response details

---

## UI Features

### Status Indicators

Throughout the UI, colored indicators show status:

| Color | Meaning |
|-------|---------|
| 🟢 Green | Connected / Success |
| 🔴 Red | Error / Disconnected |
| 🟡 Yellow | Pending / Warning |
| ⚪ Gray | Unknown / Not checked |

### Cards

Profiles and servers are displayed as cards showing:
- Name and description
- Status indicator
- Quick actions (Edit, Delete, View)
- Key metrics (server count, tools, etc.)

### Forms

Dialog forms are used for creating/editing:
- Required fields marked with *
- Validation messages shown inline
- Submit buttons disabled during processing

### Notifications

Toast notifications appear for:
- Success: Action completed
- Error: Something went wrong
- Info: General information

---

## Keyboard Shortcuts

Currently, the UI doesn't have keyboard shortcuts, but you can use standard browser shortcuts:

| Shortcut | Action |
|----------|--------|
| Tab | Navigate between elements |
| Enter | Submit forms, click buttons |
| Escape | Close dialogs |
| Ctrl/Cmd + R | Refresh page |

---

## Mobile Support

The UI is responsive and works on mobile devices:
- Cards stack vertically on small screens
- Navigation collapses to hamburger menu
- Touch-friendly buttons and inputs

---

## Browser Support

Tested and supported:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Next Steps

- [Profiles Page](./profiles-page.md) - Managing profiles
- [MCP Servers Page](./mcp-servers-page.md) - Server management
- [Debug Logs Page](./debug-logs-page.md) - Monitoring traffic
