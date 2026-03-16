# Tool customization

Customize individual tools within a profile to control what your AI assistant sees. You can enable or disable tools, rename them, override descriptions, and modify input schemas.

## Why customize tools?

- **Reduce noise**: Disable tools the AI doesn't need for a specific use case.
- **Improve accuracy**: Rename tools or refine descriptions to help the AI pick the right tool.
- **Control input**: Override input schemas to restrict or simplify what the AI sends.

## Enable or disable tools

1. Open a profile's detail page.
2. Find the MCP server whose tools you want to customize.
3. Click on the server to expand its tool list.
4. Toggle individual tools on or off.

Disabled tools are hidden from the AI when it connects to this profile's endpoint. They remain available in other profiles that include the same server.

## Rename a tool

1. Open the tool list for a server within a profile (as above).
2. Click the tool name to edit it.
3. Enter a new name.
4. Save your changes.

The AI sees the custom name instead of the original. This is useful when two servers expose tools with similar names.

## Override a tool description

1. Open the tool list for a server within a profile.
2. Click on the tool's description to edit it.
3. Enter a new description.
4. Save your changes.

A well-written description helps the AI understand when and how to use the tool.

## Customize input schemas

1. Open the tool list for a server within a profile.
2. Click on the tool to expand its settings.
3. Edit the **input schema** JSON to modify parameter definitions.
4. Save your changes.

> **Warning**: Modifying input schemas can break tool calls if the schema doesn't match what the underlying MCP server expects. Only change schemas when you understand the server's requirements.

## API reference

Tool customizations are managed through the profiles API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/:id/servers/:serverId/tools` | Get tools (use `?refresh=true` to refresh from server) |
| PUT | `/api/profiles/:id/servers/:serverId/tools` | Update tool customizations |

**Request body for `PUT`:**

```json
{
  "tools": [
    {
      "toolName": "original_tool_name",
      "isEnabled": true,
      "customName": "my_renamed_tool",
      "customDescription": "A better description for the AI",
      "customInputSchema": { ... }
    }
  ]
}
```

## Tips

- Start by disabling tools you never use. Fewer tools means faster, more accurate AI responses.
- Use descriptive custom names that clearly indicate what the tool does.
- Customizations are per-profile, so the same server can have different tool configurations in different profiles.
