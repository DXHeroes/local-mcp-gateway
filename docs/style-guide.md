# Documentation Style Guide

Thank you for contributing to the Local MCP Gateway documentation! This guide ensures our documentation remains consistent, clear, and helpful.

## Tone and Voice

- **Friendly but Professional**: Write like you're helping a colleague.
- **Concise**: Get to the point. Avoid fluff.
- **Active Voice**: "Run the command" instead of "The command should be run".
- **You-focused**: Address the reader as "you".

## Formatting

### Titles and Headings
- Use **Sentence case** for headings (only capitalize the first word and proper nouns).
- Example: `## How to create a custom server` (Not `## How To Create A Custom Server`).

### Code Blocks
Always specify the language for syntax highlighting.

```bash
pnpm dev
```

```typescript
const value = "hello";
```

### Admonitions (Callouts)
Use blockquotes for special notices. Start with **Bold** text.

> **Note**: This feature is experimental.

> **Warning**: Do not share your tunnel URL publicly.

> **Tip**: You can use `Ctrl+C` to stop the server.

## Structure (Diátaxis)

We follow the [Diátaxis framework](https://diataxis.fr/):

1.  **Tutorials**: Learning-oriented. "Let's build X together."
2.  **How-to Guides**: Problem-oriented. "How do I solve Y?"
3.  **Reference**: Information-oriented. "What is the syntax for Z?"
4.  **Explanation**: Understanding-oriented. "Why does W work this way?"

## Directory Structure

- `docs/introduction/`: Landing pages.
- `docs/tutorials/`: Step-by-step lessons.
- `docs/how-to/`: Specific guides.
- `docs/reference/`: APIs and configs.
- `docs/explanation/`: Concepts and architecture.

## Links
- Use relative links: `[Link](./other-page.md)`
- Do not use absolute paths or `.html` extensions.

## Images
- Store images in `docs/assets/` (create if needed).
- Use descriptive alt text: `![Architecture diagram](./assets/arch.png)`

