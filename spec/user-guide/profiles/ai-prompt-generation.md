# AI Prompt Generation

The gateway can generate prompts describing available tools for use with AI assistants.

## What is Prompt Generation?

When you have many tools across multiple servers, it's helpful to give AI a summary of what's available. The gateway generates structured prompts that describe:

- Profile name and endpoint
- All available tools
- Tool descriptions and parameters

---

## Viewing Generated Prompts

### Via Web UI

1. Go to **Profiles** page
2. Find your profile card
3. Expand the **"AI Prompt"** section
4. View the generated prompt

### Via API

```
GET /api/mcp/{profile-name}/info
```

The response includes tool information that can be formatted into prompts.

---

## Prompt Format

### TOON Format

The gateway uses TOON format for efficient encoding:

```
<profile>
name: development
endpoint: http://localhost:3001/api/mcp/development

<tools>
- github_create_issue: Create a GitHub issue
  params: repo (string, required), title (string, required), body (string)

- github_list_issues: List issues in a repository
  params: repo (string, required), state (string: open|closed|all)

- linear_create_ticket: Create a Linear ticket
  params: title (string, required), description (string)
</tools>
</profile>
```

### Benefits

- **Compact** - Smaller than full JSON schemas
- **Readable** - Easy for AI to parse
- **Complete** - Includes all essential information

---

## Using Generated Prompts

### Option 1: Copy and Paste

1. Generate prompt in gateway UI
2. Copy to clipboard
3. Paste at the start of your AI conversation

Example:
```
Here are the tools available to you:
[paste generated prompt]

Now, help me create a GitHub issue for the login bug.
```

### Option 2: System Prompt

Include the generated prompt in your system prompt or configuration for persistent context.

### Option 3: Dynamic Inclusion

Some AI clients can dynamically include tool information. The gateway's prompt can supplement this.

---

## Customizing Prompts

### Current Capabilities

The current prompt generation:
- Lists all tools from all servers
- Includes parameter information
- Uses standard format

### Future Enhancements

Planned features:
- Custom prompt templates
- Selective tool inclusion
- Multiple output formats

---

## Tool Information Included

For each tool, the prompt includes:

| Field | Description |
|-------|-------------|
| Name | Tool identifier |
| Description | What the tool does |
| Parameters | Input parameters with types |
| Required | Which parameters are required |

### Example Tool Entry

```
- github_create_issue: Create a new issue in a GitHub repository
  Parameters:
    - repository (string, required): Repository in format "owner/repo"
    - title (string, required): Issue title
    - body (string, optional): Issue description in markdown
    - labels (array, optional): Labels to apply
```

---

## When to Use Prompts

### Helpful For

- **New conversations** - Prime AI with available tools
- **Complex workflows** - Remind AI of capabilities
- **Tool selection** - Help AI choose the right tool
- **Documentation** - Share tool info with team

### Not Needed For

- **Simple tool calls** - AI usually discovers tools automatically
- **Single-tool profiles** - Obvious what's available
- **MCP-native clients** - Handle tool discovery internally

---

## Troubleshooting

### Prompt is empty

1. Check profile has servers assigned
2. Verify servers are connected
3. Ensure servers have tools

### Prompt is outdated

1. Prompts are generated on-demand
2. Expand/collapse to refresh
3. Check if server tools have changed

### Prompt too long

If you have many tools:
- Consider splitting into focused profiles
- Use selective tool prompts
- Let AI discover tools dynamically

---

## API Access

### Get Tool Information

```bash
curl http://localhost:3001/api/mcp/my-profile/info | jq '.tools'
```

### Format as Prompt

Process the API response to create custom prompts in your preferred format.

---

## See Also

- [Profile Endpoints](./profile-endpoints.md) - API details
- [Creating Profiles](./creating-profiles.md) - Profile setup
- [Tool Name Conflicts](../mcp-servers/tool-name-conflicts.md) - Tool naming
