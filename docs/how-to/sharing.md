# Sharing

Share your MCP servers and profiles with other members of your organization. Sharing lets your team reuse server configurations and profiles without duplicating setup.

## Share an MCP server

1. Go to the **MCP Servers** page.
2. Find the server you want to share and open its detail view.
3. Click **Share**.
4. Choose who to share with:
   - **Organization**: Share with all members of the active organization.
   - **User**: Share with a specific user.
5. Select a permission level:
   - **Admin**: The recipient can modify the server configuration.
   - **Use**: The recipient can use the server in their profiles but cannot modify it.
6. Click **Share**.

## Share a profile

1. Go to the **Profiles** page.
2. Find the profile you want to share and open its detail view.
3. Click **Share**.
4. Choose who to share with and select a permission level (same options as above).
5. Click **Share**.

## Permission levels

| Permission | Can use in profiles | Can modify configuration | Can re-share |
|-----------|:-:|:-:|:-:|
| **Admin** | Yes | Yes | Yes |
| **Use** | Yes | No | No |

## View shared resources

Shared servers and profiles appear alongside your own resources in the UI. They are marked to indicate they are shared with you.

- On the **MCP Servers** page, shared servers appear in your server list.
- On the **Profiles** page, shared profiles appear in your profile list.

## Remove a share

1. Open the detail view of the shared resource.
2. Click **Share** to view current shares.
3. Click **Remove** next to the share you want to revoke.

The person or organization loses access immediately.

## How sharing works

- Sharing is scoped to organizations. You can only share with members of the same organization.
- When you share an MCP server, the recipient can add it to their own profiles.
- When you share a profile, the recipient can use it as an MCP endpoint.
- The owner of a resource always retains full control regardless of sharing settings.
