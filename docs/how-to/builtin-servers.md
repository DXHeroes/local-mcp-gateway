# Built-in MCP servers

Local MCP Gateway includes several built-in MCP server packages that are auto-discovered at startup. These packages live in the `mcp-servers/` directory and provide ready-to-use integrations.

## Available built-in servers

### Gemini Deep Research

Conducts comprehensive AI-powered research using Google's Deep Research Agent. Autonomously searches the web, reads sources, and synthesizes detailed research reports.

- **API key required**: Google API key (`GEMINI_API_KEY`)
- **Typical usage**: Research tasks that take 5-20 minutes
- **Cost**: Approximately $2-5 per research task

### Toggl Track

Time tracking, project management, and reporting via the Toggl Track API. Create time entries, manage projects and clients, and generate reports.

- **API key required**: Toggl API token (found in your Toggl profile settings)
- **Authentication**: Basic auth with API token

### Fakturoid

Invoicing, contacts, expenses, and accounting via the Fakturoid API v3. Designed for Czech businesses.

- **API key required**: Personal access token from Fakturoid
- **Authentication**: Format `slug:personal_access_token`

### Merk

Czech and Slovak company data including financials, business relations, employee counts, fleet information, and business intelligence.

- **API key required**: Merk API token
- **Authentication**: Token-based

### Abra Flexi

Invoices, contacts, products, and accounting via the Abra Flexi REST API. Designed for Czech businesses using the Abra Flexi ERP system.

- **API key required**: Abra Flexi credentials
- **Authentication**: Basic auth, URL format `https://server/c/company|username:password`

## How auto-discovery works

Built-in MCP server packages are automatically discovered at startup:

1. The backend scans all dependencies for packages with `"mcpPackage": true` in their `package.json`.
2. Discovered packages are registered in the MCP registry.
3. The seed service creates database records for each package.
4. Servers appear in the UI under **MCP Servers** > **Presets**.

You don't need to manually configure these servers — just add them from the presets list.

## Add a built-in server to a profile

1. Go to the **MCP Servers** page.
2. Click **Add from presets**.
3. Select the built-in server you want to use.
4. Enter the required API key when prompted.
5. Click **Add**.
6. Go to your profile and add the newly created server.

## Configure API keys

You can set API keys in two ways:

- **Environment variable**: Set the key in your `.env` file (e.g., `GEMINI_API_KEY=your-key`). The server picks it up automatically.
- **UI**: Enter the API key when adding the server from presets, or update it later in the server's settings.

See [Environment setup](../ENVIRONMENT_SETUP.md) for the full list of supported environment variables.
