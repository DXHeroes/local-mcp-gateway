# Contributing to Local MCP Gateway

Thank you for your interest in contributing! This guide covers how to get involved.

## Ways to Contribute

### Code Contributions

- Bug fixes
- New features
- Performance improvements
- Test coverage

### Documentation

- Fix typos and errors
- Add missing documentation
- Improve clarity
- Add examples

### Community

- Answer questions
- Report bugs
- Suggest features
- Share use cases

---

## Getting Started

### 1. Fork the Repository

Fork the repository on GitHub.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/local-mcp-gateway.git
cd local-mcp-gateway
```

### 3. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Development Guidelines

### Code Style

- **TypeScript** for all code
- **Biome** for formatting and linting
- Run `pnpm lint` before committing
- Run `pnpm format` to auto-format

### Commit Messages

Follow conventional commits:

```
feat: add new profile export feature
fix: resolve OAuth token refresh issue
docs: update installation guide
test: add tests for ProxyHandler
refactor: simplify server factory logic
```

### Testing

- Write tests for new features
- Maintain existing test coverage
- Run `pnpm test` before submitting

### Documentation

- Update docs for user-facing changes
- Add JSDoc comments for public APIs
- Keep README.md accurate

---

## Pull Request Process

### 1. Ensure Quality

- [ ] All tests pass
- [ ] Code is formatted
- [ ] Documentation updated
- [ ] No console.log statements

### 2. Create Pull Request

- Clear title describing the change
- Description of what and why
- Link to related issues

### 3. Address Review Feedback

- Respond to comments
- Make requested changes
- Keep discussion constructive

### 4. Merge

Once approved, maintainers will merge your PR.

---

## Project Structure

```
local-mcp-gateway/
├── apps/
│   ├── backend/     # Express API server
│   └── frontend/    # React UI
├── packages/
│   ├── core/        # Business logic
│   ├── database/    # Data layer
│   ├── ui/          # UI components
│   └── config/      # Shared configs
├── spec/            # Documentation
└── scripts/         # Build scripts
```

---

## Areas for Contribution

### Good First Issues

- Documentation improvements
- Test coverage
- Bug fixes with clear reproduction
- UI/UX improvements

### Larger Projects

- New MCP server types
- Authentication improvements
- Performance optimization
- New integrations

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn
- Assume good intentions

---

## Getting Help

- Check existing documentation
- Search existing issues
- Ask in discussions
- Be specific when asking questions

---

## See Also

- [Development Setup](./development-setup.md) - Detailed dev environment
- [Testing Guide](./testing-guide.md) - Testing strategies
- [Code Style](./code-style.md) - Style conventions
