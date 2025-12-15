# Contributing to Stream Pilot

Thank you for your interest in contributing to Stream Pilot! This document provides guidelines and instructions for contributing.

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
- **Environment**: OS, Node version, OBS version, Claude Desktop version
- **Logs**: Relevant error messages and stack traces
- **Screenshots**: If applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Include:
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other approaches you considered
- **Examples**: Similar features in other tools

### Feature Ideas

Some areas that need work:
- Advanced scene transitions with custom effects
- Twitch EventSub integration for real-time notifications
- Stream analytics and viewer insights
- Automated highlight detection
- YouTube/Facebook Gaming support
- Plugin and filter control in OBS
- Streamlabs/StreamElements integration
- Web dashboard for monitoring multiple streams

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/stream-pilot.git
   cd stream-pilot
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
   git commit -m "feat: add support for scene transitions"
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
   - Screenshots/demos if applicable
   - Testing instructions

### PR Review Process

- Maintainers will review your PR within a few days
- Address feedback and requested changes
- Keep PRs focused on a single feature/fix
- Squash commits before merging if requested

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- OBS Studio 28+
- Twitch Developer account
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

# Run tests (when available)
npm test
```

### Project Structure

```
stream-pilot/
├── src/
│   ├── obs-client.ts       # OBS WebSocket wrapper
│   ├── twitch-client.ts    # Twitch API wrapper
│   ├── mcp-server.ts       # MCP server implementation
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
 * Get live stream information for a Twitch user
 * @param userLogin - Twitch username to check
 * @returns Stream information or null if offline
 */
async getStream(userLogin: string): Promise<TwitchStream | null> {
  try {
    const response = await this.api.get('/streams', {
      params: { user_login: userLogin },
    });
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Failed to get stream:', error);
    return null;
  }
}
```

## Testing

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Mock external dependencies (OBS, Twitch API)

### Test Structure

```typescript
describe('TwitchClient', () => {
  describe('getStream', () => {
    it('should return stream data when user is live', async () => {
      // Test implementation
    });

    it('should return null when user is offline', async () => {
      // Test implementation
    });

    it('should handle API errors gracefully', async () => {
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

Thank you for contributing to Stream Pilot! 🎥
