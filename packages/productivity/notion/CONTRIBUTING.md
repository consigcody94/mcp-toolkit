# Contributing to Notion Weaver

Thank you for your interest in contributing to Notion Weaver! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (Node.js version, OS, etc.)
- **Error messages** and stack traces if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement useful?
- **Proposed solution** if you have one
- **Alternatives considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Add tests** if applicable
4. **Update documentation** as needed
5. **Ensure TypeScript compiles** without errors (`npm run build`)
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Update the README.md if you change functionality
- Add yourself to the contributors list if you'd like

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/notion-weaver.git
cd notion-weaver

# Install dependencies
npm install

# Build the project
npm run build

# Run in watch mode during development
npm run watch
```

## Code Style

- **TypeScript strict mode** - all code must pass strict type checking
- **ES2022 syntax** - use modern JavaScript features
- **Consistent formatting** - follow existing patterns
- **Meaningful names** - use descriptive variable and function names
- **Comments** - add comments for complex logic

### TypeScript Guidelines

```typescript
// Good - explicit types, clear intent
interface CreatePageParams {
  parent_database_id?: string;
  title: string;
}

async function createPage(params: CreatePageParams): Promise<Page> {
  // Implementation
}

// Avoid - implicit any, unclear types
async function createPage(params) {
  // Implementation
}
```

## Testing

When adding new features:

1. Test manually with various inputs
2. Test error cases and edge cases
3. Verify TypeScript types are correct
4. Check that the MCP protocol is properly implemented

## Commit Messages

Follow these guidelines for commit messages:

```
type: brief description

More detailed explanation if needed.

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add support for database property updates

fix: handle missing parent_id in create_page

docs: update README with new examples
```

## Project Structure

```
notion-weaver/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── README.md             # User documentation
├── CONTRIBUTING.md       # This file
├── LICENSE               # MIT license
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm (if applicable)
5. Create GitHub release

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project README (optional)

Thank you for contributing to Notion Weaver!
