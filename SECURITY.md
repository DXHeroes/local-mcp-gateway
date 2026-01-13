# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Local MCP Gateway, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to the maintainers or use GitHub's private vulnerability reporting feature.

### What to Include

When reporting a vulnerability, please include:

1. Description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact
4. Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution**: Depends on severity and complexity

### Supported Versions

We provide security updates for the latest stable release only.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | Yes                |
| Older   | No                 |

## Security Best Practices

When using Local MCP Gateway:

1. **Keep dependencies updated** - Run `pnpm update` regularly
2. **Protect your `.env` file** - Never commit secrets to git
3. **Use HTTPS in production** - Especially for OAuth flows
4. **Review MCP server permissions** - Only enable servers you trust

## Acknowledgments

We appreciate security researchers who help keep this project safe. Contributors who report valid vulnerabilities will be acknowledged (with permission) in our release notes.
