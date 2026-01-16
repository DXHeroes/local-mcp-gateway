# Understanding the TOON Format

**TOON (Token-Oriented Object Notation)** is a compact, human-readable, schema-aware data format designed specifically for Large Language Models (LLMs).

## Why not JSON?

JSON is great for machines, but inefficient for LLMs.
- **Redundancy**: Keys are repeated for every item in a list (`{"name": "A"}, {"name": "B"}`).
- **Token Cost**: Curly braces, quotes, and whitespace add up quickly.
- **Context Window**: Limited context windows mean every token counts.

## TOON Structure

TOON separates the **schema** (header) from the **data** (rows).

```toon
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

### Key Benefits

1.  **Token Efficiency**: Often saves 30-50% tokens compared to JSON.
2.  **Schema Awareness**: The header explicitly defines what each field means, reducing hallucinations.
3.  **Readability**: It looks like a clean table or CSV, which models parse easily.

## Usage in Local MCP Gateway

We use TOON to generate the **AI Prompt** for your profiles.

When you copy the prompt from the UI, it generates a TOON block containing:
1.  **Profile Info**: Name and URL.
2.  **Tools List**: A concise list of all available tools.
3.  **Input Schemas**: JSON schemas for tool arguments, embedded within the TOON structure.

### Example

```toon
data{profile,url,tools}:
  "My Work Profile","https://blue-sky.loca.lt/api/mcp/work",[
    {
      "name": "linear_create_issue",
      "description": "Creates a new issue in Linear",
      "input_schema": { "type": "object", "properties": { "title": { "type": "string" } } }
    },
    {
      "name": "github_list_prs",
      "description": "List open PRs",
      "input_schema": { "type": "object", "properties": { "repo": { "type": "string" } } }
    }
  ]
```

By pasting this into Claude or Cursor, you give the AI a "map" of your tools without overwhelming its context window with verbose JSON.

## Alternative: Markdown Format

While TOON is optimized for token efficiency, the gateway also provides a **Markdown format** as an alternative:

### When to Use Markdown
- **Human Review**: When you want to review tool configurations before sharing with AI
- **Documentation**: For internal documentation or README files
- **Debugging**: When troubleshooting tool configuration issues
- **Team Sharing**: When sharing configurations with non-technical team members

### When to Use TOON
- **Production Use**: When token efficiency matters
- **Daily AI Work**: For regular interactions with Claude or Cursor
- **Large Tool Sets**: When you have many tools and need to minimize context usage

Both formats are available in the UI on the Profile detail page under the "AI Prompt" tab.

