# Contributing to API Pilot

Thank you for your interest in contributing to API Pilot! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Verify you're using the latest version
3. Test with minimal configuration

When reporting bugs, include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Exact steps to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node version, Claude Desktop version
- **Logs**: Relevant error messages and stack traces
- **Config**: MCP configuration (redact sensitive info)

### Suggesting Enhancements

Enhancement suggestions are welcome! Include:
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other approaches you considered
- **Examples**: Similar features in other tools

### Feature Ideas

Some areas that need work:
- Request/response recording and replay
- GraphQL support
- WebSocket mocking
- Import/export Postman collections
- Generate OpenAPI specs from collections
- Request chaining and variable extraction
- Performance testing capabilities
- API diff comparison
- Auto-generate mock data from schemas

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/api-pilot.git
   cd api-pilot
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Follow the code style guidelines below
   - Add tests for new features
   - Update documentation
   - Ensure all tests pass

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add GraphQL query builder"
   ```

   Use conventional commit messages:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `test:` Adding/updating tests
   - `chore:` Maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a pull request on GitHub with:
   - Clear title and description
   - Link to related issues
   - Testing instructions
   - Screenshots/examples if applicable

### PR Review Process

- Maintainers will review your PR within a few days
- Address feedback and requested changes
- Keep PRs focused on a single feature/fix
- Squash commits before merging if requested

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run typecheck

# Run linter
npm run lint
```

### Project Structure

```
api-pilot/
├── src/
│   ├── mock-server.ts      # Express-based mock server
│   ├── api-client.ts       # HTTP client with collections
│   ├── openapi-parser.ts   # OpenAPI/Swagger parser
│   ├── mcp-server.ts       # MCP protocol server
│   ├── types.ts            # TypeScript type definitions
│   └── index.ts            # Entry point
├── dist/                   # Compiled JavaScript (generated)
├── package.json            # Project metadata
├── tsconfig.json           # TypeScript configuration
├── README.md              # Main documentation
└── CONTRIBUTING.md        # This file
```

## Code Style Guidelines

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **Types**: Prefer interfaces over type aliases for object shapes
- **Naming**:
  - `PascalCase` for classes and interfaces
  - `camelCase` for functions and variables
  - `UPPER_SNAKE_CASE` for constants
- **Exports**: Use named exports, avoid default exports
- **Imports**: Use `.js` extensions for ESM imports

### Code Organization

- **Single Responsibility**: Each function/class should do one thing well
- **DRY**: Don't repeat yourself - extract common patterns
- **Comments**: Explain *why*, not *what*
- **Documentation**: Add JSDoc comments for public APIs
- **Error Handling**: Always handle errors gracefully

### Example

```typescript
/**
 * Execute a request from a collection
 * @param collectionId - ID of the collection
 * @param requestId - ID of the request to execute
 * @returns HTTP response with status, body, and duration
 */
async executeCollectionRequest(
  collectionId: string,
  requestId: string
): Promise<HTTPResponse> {
  const collection = this.collections.get(collectionId);
  if (!collection) {
    throw new Error(`Collection ${collectionId} not found`);
  }

  const request = collection.requests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error(`Request ${requestId} not found in collection`);
  }

  return this.makeRequest(this.buildHTTPRequest(collection, request));
}
```

## Testing

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Mock external dependencies

### Test Structure

```typescript
describe('APIClient', () => {
  describe('executeCollectionRequest', () => {
    it('should execute request with collection variables', async () => {
      // Test implementation
    });

    it('should throw error when collection not found', async () => {
      // Test implementation
    });

    it('should handle authentication correctly', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### README Updates

- Update README.md when adding new features
- Add examples for new MCP tools
- Update troubleshooting section for common issues
- Keep the tools reference table current

### Code Comments

- Document all public APIs with JSDoc
- Explain complex algorithms and business logic
- Add TODO comments for future improvements
- Keep comments up-to-date with code changes

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push --tags`
5. Create GitHub release with notes

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Issues**: Create an issue with details
- **Chat**: Join our community (coming soon)
- **Email**: consigcody94@gmail.com

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Credited in project documentation

Thank you for contributing to API Pilot! 🚀
