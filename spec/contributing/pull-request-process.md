# Pull Request Process

Guide for contributing code through pull requests.

## Overview

This document describes how to submit code changes to Local MCP Gateway.

---

## Quick Checklist

Before submitting:

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All checks pass locally
- [ ] Commit messages are clear
- [ ] PR description is complete

---

## Workflow

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/local-mcp-gateway.git
cd local-mcp-gateway
git remote add upstream https://github.com/DXHeroes/local-mcp-gateway.git
```

### 2. Create Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-oauth-refresh` |
| Bug fix | `fix/description` | `fix/token-expiry-check` |
| Docs | `docs/description` | `docs/update-api-reference` |
| Refactor | `refactor/description` | `refactor/proxy-handler` |

### 3. Make Changes

```bash
# Make your changes
# ...

# Run checks
pnpm check
pnpm test

# Stage and commit
git add .
git commit -m "feat: add automatic token refresh"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub.

---

## Commit Messages

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance |

### Examples

```bash
# Feature
git commit -m "feat(oauth): add automatic token refresh"

# Bug fix
git commit -m "fix(proxy): handle connection timeout"

# Documentation
git commit -m "docs: update API reference"

# With body
git commit -m "feat(profiles): add profile description field

Added optional description field to profiles.
Updated API and UI to support the new field."
```

---

## PR Description

### Template

```markdown
## Summary

Brief description of changes.

## Changes

- Added X
- Updated Y
- Fixed Z

## Testing

Describe how to test the changes.

## Screenshots (if UI changes)

[Add screenshots]

## Checklist

- [ ] Tests added
- [ ] Documentation updated
- [ ] Follows code style
```

### Example

```markdown
## Summary

Adds automatic OAuth token refresh to prevent expired token errors.

## Changes

- Added token expiry check in OAuthManager
- Implemented automatic refresh 5 minutes before expiry
- Added refresh failure handling with user notification
- Updated tests for new refresh logic

## Testing

1. Configure an OAuth server with short token expiry
2. Authenticate and wait for near-expiry
3. Verify token refreshes automatically
4. Verify tool calls work during refresh

## Checklist

- [x] Tests added
- [x] Documentation updated
- [ ] Follows code style
```

---

## Code Review

### Review Criteria

Reviewers check for:

1. **Correctness** - Does it work?
2. **Style** - Follows conventions?
3. **Tests** - Adequate coverage?
4. **Performance** - Any concerns?
5. **Security** - Any vulnerabilities?
6. **Documentation** - Updated?

### Responding to Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push origin feature/your-feature-name
```

Or amend if minor:
```bash
git add .
git commit --amend --no-edit
git push --force-with-lease origin feature/your-feature-name
```

---

## Merging

### Requirements

- All CI checks pass
- At least one approval
- No unresolved comments
- Up to date with main

### Merge Strategy

We use **Squash and Merge** for clean history:

1. All commits squashed into one
2. PR title becomes commit message
3. Original commits preserved in PR

---

## After Merge

### Clean Up

```bash
# Switch to main
git checkout main

# Update from upstream
git pull upstream main

# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch (or use GitHub UI)
git push origin --delete feature/your-feature-name
```

---

## Special Cases

### Breaking Changes

For breaking changes:

1. Add `BREAKING CHANGE:` in commit footer
2. Clearly document migration path
3. Update changelog

```bash
git commit -m "feat!: change config format

BREAKING CHANGE: Config now uses 'serverUrl' instead of 'url'.
Migration: Update all configs to use the new field name."
```

### Documentation Only

For docs-only changes:

- Use `docs:` prefix
- Can be merged quickly
- No tests required

### Hotfixes

For urgent fixes:

1. Branch from main
2. Minimal changes only
3. Fast-track review
4. Cherry-pick to release if needed

---

## CI/CD

### Automated Checks

On every PR:

- [ ] Lint check
- [ ] Type check
- [ ] Unit tests
- [ ] Integration tests
- [ ] Build check

### Required Checks

Must pass before merge:
- `lint`
- `typecheck`
- `test`
- `build`

---

## Getting Help

### Questions

- Open a discussion on GitHub
- Ask in PR comments
- Check existing PRs for examples

### Stuck?

If your PR is stuck:

1. Ping reviewers
2. Ask for clarification
3. Request pair review

---

## See Also

- [Development Setup](./development-setup.md) - Environment setup
- [Code Style](./code-style.md) - Coding standards
- [Testing Guide](./testing-guide.md) - Testing practices
