# Contributing to Code Memory

Thank you for your interest in contributing to Code Memory! This MCP server solves the critical "missing context" problem in AI-assisted development.

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
- **Environment details** (Node.js version, OS, storage directory)
- **Error messages** and stack traces if applicable
- **Sample data** if relevant (ensure no sensitive information)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - how does this help solve the context problem?
- **Proposed solution** if you have one
- **Alternatives considered**
- **Impact** - how many developers would benefit?

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Add tests** if applicable
4. **Update documentation** as needed
5. **Ensure TypeScript compiles** without errors (`npm run build`)
6. **Test with a real MCP client** (like Claude Desktop)
7. **Commit your changes** with clear commit messages
8. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Update the README.md if you change functionality
- Maintain backward compatibility when possible
- Add yourself to the contributors list if you'd like

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/code-memory.git
cd code-memory

# Install dependencies
npm install

# Build the project
npm run build

# Run in watch mode during development
npm run watch

# Test with Claude Desktop by updating config
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
interface Decision {
  id: string;
  title: string;
  timestamp: string;
}

async function saveDecision(decision: Decision): Promise<void> {
  // Implementation
}

// Avoid - implicit any, unclear types
async function saveDecision(decision) {
  // Implementation
}
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  await fs.readFile(path, "utf-8");
} catch (error) {
  return {
    content: [{
      type: "text",
      text: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }],
    isError: true,
  };
}
```

## Testing

When adding new features:

1. Test manually with various inputs
2. Test error cases and edge cases
3. Test with large codebases (performance)
4. Verify TypeScript types are correct
5. Check that the MCP protocol is properly implemented
6. Test storage file integrity

### Test Scenarios

- Index a small codebase (< 100 files)
- Index a large codebase (> 1000 files)
- Search with various queries
- Save decisions and retrieve them
- Test with missing/corrupted storage files
- Test with invalid paths

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
- `perf`: Performance improvements
- `chore`: Maintenance tasks

Examples:
```
feat: add file type filtering in search

fix: handle corrupted index.json gracefully

docs: update README with performance metrics

perf: optimize search algorithm for large codebases
```

## Project Structure

```
code-memory/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── README.md             # User documentation
├── CONTRIBUTING.md       # This file
├── LICENSE               # MIT license
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Storage Format

When modifying storage:

1. Maintain backward compatibility
2. Document format changes
3. Provide migration path if needed
4. Test with existing storage files

## Performance Considerations

- **Indexing**: Aim for > 500 files/second
- **Search**: Keep under 100ms for typical queries
- **Memory**: Keep memory usage reasonable for large codebases
- **Storage**: Minimize file size while maintaining readability

## Documentation

When adding features:

1. Update README.md with examples
2. Add inline code comments
3. Update tool descriptions in schema
4. Document any environment variables
5. Add troubleshooting tips if needed

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm (if applicable)
5. Create GitHub release

## Feature Ideas

We're particularly interested in contributions that:

- Improve search relevance and speed
- Add more file type support
- Enhance context retrieval
- Improve storage efficiency
- Add export/import capabilities
- Integrate with more development tools

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project README (optional)

## Impact

Remember, Code Memory solves a real problem that affects 65% of developers using AI assistants. Your contributions help developers worldwide maintain context and work more efficiently.

Thank you for contributing to Code Memory!
