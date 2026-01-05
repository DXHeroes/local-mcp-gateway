# Use Case: Development Workflow

Supercharge your coding workflow by giving Claude access to GitHub, project management, databases, and documentation.

## Overview

| Aspect | Details |
|--------|---------|
| **Goal** | AI-assisted software development |
| **Difficulty** | Intermediate |
| **Time** | 30-45 minutes |
| **Prerequisites** | Local MCP Gateway running, GitHub account |

---

## What You'll Build

A `development` profile with access to:

- **GitHub** - Repository management, issues, PRs
- **Linear** - Project and task management
- **Database** - Query development databases
- **Documentation** - Search docs and references

---

## Step 1: Create the Development Profile

1. Open the web UI at `http://localhost:3000`
2. Click **"Create Profile"**
3. Configure:
   - **Name**: `development`
   - **Description**: `Tools for software development`
4. Click **"Create"**

---

## Step 2: Add GitHub Server

GitHub provides one of the most useful MCP servers for developers.

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `GitHub`
   - **Type**: Remote HTTP
   - **URL**: (Your GitHub MCP server URL or official GitHub MCP)

3. Configure OAuth:
   - **Authorization URL**: `https://github.com/login/oauth/authorize`
   - **Token URL**: `https://github.com/login/oauth/access_token`
   - **Client ID**: (Create at github.com/settings/developers)
   - **Scopes**: `repo read:user`

4. Click **"Create"**

### Available GitHub Tools

| Tool | What it does |
|------|--------------|
| `list_repositories` | Browse your repositories |
| `get_repository` | Get repo details |
| `list_issues` | View issues |
| `create_issue` | Open new issues |
| `list_pull_requests` | View PRs |
| `create_pull_request` | Open new PRs |
| `get_file_contents` | Read files from repos |
| `search_code` | Search across repositories |

---

## Step 3: Add Linear Server

Linear integration enables project management within Claude.

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Linear`
   - **Type**: Remote SSE (Linear uses SSE)
   - **URL**: `https://api.linear.app/mcp`

3. Configure OAuth or API Key:
   - **API Key**: Generate at linear.app/settings/api
   - **Header**: `Authorization`
   - **Template**: `Bearer {key}`

4. Click **"Create"**

### Available Linear Tools

| Tool | What it does |
|------|--------------|
| `list_issues` | View your tickets |
| `create_issue` | Create new tickets |
| `update_issue` | Modify tickets |
| `list_projects` | View projects |
| `search_issues` | Find specific tickets |

---

## Step 4: Add Database Server

Direct database access lets Claude help with queries and data analysis.

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Dev Database`
   - **Type**: External Stdio (for local) or Remote HTTP
   - Configure your database MCP server (PostgreSQL, MySQL, etc.)

3. Click **"Create"**

### Available Database Tools

| Tool | What it does |
|------|--------------|
| `query` | Execute SQL queries |
| `list_tables` | Show database tables |
| `describe_table` | Get table schema |
| `list_databases` | Show available databases |

**Security Warning**: Use a read-only database user for development queries. Never connect production databases with write access.

---

## Step 5: Add Documentation Server

Help Claude find answers in your documentation.

1. Go to **"MCP Servers"** → **"Add MCP Server"**
2. Configure:
   - **Name**: `Docs`
   - **Type**: Remote HTTP
   - **URL**: Your documentation MCP server or a web search server

3. Click **"Create"**

### Available Documentation Tools

| Tool | What it does |
|------|--------------|
| `search_docs` | Search documentation |
| `get_page` | Fetch specific doc pages |

---

## Step 6: Assign Servers to Profile

1. Go to **"Profiles"**
2. Click **"Edit"** on the `development` profile
3. Check all development servers:
   - GitHub
   - Linear
   - Dev Database
   - Docs
4. Click **"Save"**

---

## Step 7: Configure Your IDE

### Claude Desktop

```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

### Cursor IDE

In Cursor settings, add the MCP server URL:
```
http://localhost:3001/api/mcp/development
```

### Claude Code CLI

Configure in your project's MCP settings:
```json
{
  "mcpServers": {
    "development": {
      "url": "http://localhost:3001/api/mcp/development"
    }
  }
}
```

---

## Using Your Development Workflow

### Issue Management

```
"Show me all open bugs assigned to me"
"Create an issue for the login timeout bug we discussed"
"What's the status of issue #123?"
"Move my tickets from 'In Progress' to 'In Review'"
```

### Code Navigation

```
"Find the authentication middleware in the backend repo"
"Show me how error handling is implemented"
"Search for usages of the UserService class"
"What files were changed in PR #45?"
```

### Database Queries

```
"Show me the schema for the users table"
"How many users signed up this week?"
"Find orders with status 'pending' from the last 24 hours"
"What's the average order value by country?"
```

### Project Planning

```
"What are the remaining tasks for the Q4 release?"
"Create a spike ticket for investigating the performance issue"
"Show me all high-priority bugs"
"Summarize what the team worked on this sprint"
```

### Combined Workflows

```
"Find the issue about the payment bug, check the related PR, and show me the database changes"

"Create a GitHub issue for the bug I found, add a Linear ticket, and assign to me"

"Search our codebase for rate limiting, check if there are related issues, and summarize what we have"
```

---

## Advanced Configuration

### Multiple Environments

Create separate profiles for different environments:

```
development (dev database, staging GitHub)
production (prod database read-only, prod GitHub)
testing (test database, test repos)
```

### Repository Filtering

If using the GitHub MCP server, you can configure which repositories are accessible:

```json
{
  "repositories": ["org/repo1", "org/repo2"],
  "excludeRepositories": ["org/legacy-*"]
}
```

### Database Safety

For database servers, configure:
- Read-only access for most queries
- Query timeout limits
- Result row limits
- Allowed tables/schemas

---

## Example Workflow: Bug Fix

Here's a complete workflow using your development profile:

1. **Find the bug**:
   ```
   "Search Linear for the 'checkout timeout' bug"
   ```

2. **Understand the context**:
   ```
   "Show me the related GitHub issue and any linked PRs"
   ```

3. **Explore the code**:
   ```
   "Find the checkout function in the codebase"
   ```

4. **Check the data**:
   ```
   "Query the orders table for failed checkouts in the last hour"
   ```

5. **Update status**:
   ```
   "Move the Linear ticket to 'In Progress' and add a comment about what I found"
   ```

---

## Security Best Practices

### GitHub

- Use fine-grained personal access tokens
- Limit repository access to needed repos
- Avoid write access if not needed

### Database

- Create a dedicated read-only user
- Limit to development databases only
- Never connect production with write access
- Set query timeouts

### Linear

- Use API keys with minimal scopes
- Consider team-level vs workspace-level access

---

## Troubleshooting

### GitHub authorization fails

1. Check OAuth app is configured correctly
2. Verify callback URL matches gateway URL
3. Ensure required scopes are approved

### Linear SSE disconnects

1. SSE connections may timeout; gateway handles reconnection
2. Check API key is valid
3. Verify network allows SSE connections

### Database queries fail

1. Check connection string
2. Verify user has required permissions
3. Check query timeout settings

### Tools appear with prefixes

When multiple servers have same-named tools, they're prefixed:
- `github:search` vs `docs:search`

This is expected behavior for conflict resolution.

---

## Next Steps

- [Team Collaboration](./team-collaboration.md) - Share with your team
- [Debug Logs](../web-ui/debug-logs-page.md) - Monitor tool calls
- [Tool Name Conflicts](../mcp-servers/tool-name-conflicts.md) - Handle duplicate tools
