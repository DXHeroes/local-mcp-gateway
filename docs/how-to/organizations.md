# Organizations

Organizations are multi-tenant workspaces that let you group users, MCP servers, and profiles together. Use them to separate personal and team resources.

## Create an organization

1. Click the organization switcher in the top navigation bar.
2. Select **Create organization**.
3. Enter a name for your organization (e.g., "My Team").
4. Click **Create**.

A URL-friendly slug is generated automatically from the name.

## Switch between organizations

1. Click the organization switcher in the top navigation bar.
2. Select the organization you want to switch to.

Your servers, profiles, and shared resources update to reflect the active organization.

## Invite members

You need the **owner** or **admin** role to invite members.

1. Go to **Settings** > **Organization**.
2. Click **Invite member**.
3. Enter the person's email address.
4. Select a role: **admin** or **member**.
5. Click **Send invitation**.

The invited person receives an email with a link to accept the invitation. If they don't have an account yet, they'll be prompted to sign up first.

> **Note**: Invitation emails require the `RESEND_API_KEY` environment variable. Without it, invitations are created but emails are not sent. See [Environment setup](../ENVIRONMENT_SETUP.md) for details.

## Manage member roles

You need the **owner** role to change member roles.

1. Go to **Settings** > **Organization**.
2. Find the member in the members list.
3. Click the role dropdown next to their name.
4. Select the new role: **owner**, **admin**, or **member**.

### Role summary

| Role | Manage members | Manage servers & profiles | Use shared resources |
|------|:-:|:-:|:-:|
| **Owner** | Yes | Yes | Yes |
| **Admin** | Yes (invite only) | Yes | Yes |
| **Member** | No | No | Yes |

## Set up auto-join domains

Auto-join domains allow new users with matching email addresses to automatically join your organization when they sign up.

1. Go to **Settings** > **Organization** > **Domains**.
2. Enter a domain (e.g., `company.com`).
3. Click **Add domain**.

When a new user signs up with an `@company.com` email, they are automatically added as a **member** of your organization instead of getting a personal workspace.

## Remove a member

1. Go to **Settings** > **Organization**.
2. Find the member in the members list.
3. Click **Remove**.

Removed members lose access to all organization resources immediately.
