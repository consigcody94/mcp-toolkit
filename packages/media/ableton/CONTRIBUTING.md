# Contributing to studio-pilot

Thank you for your interest in contributing to studio-pilot! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and collaborative environment. We welcome contributions from everyone, regardless of experience level.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title**: Describe the issue in one line
- **Environment**:
  - OS (macOS, Windows, Linux) and version
  - Node.js version
  - Ableton Live version
  - Claude Desktop version
  - studio-pilot version
- **Steps to reproduce**: Detailed steps to trigger the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Error messages**: Full error messages and stack traces
- **Configuration**: Your `claude_desktop_config.json` (remove sensitive info)
- **Logs**: Relevant logs from Claude Desktop and Ableton Live

### ✨ Suggesting Enhancements

Enhancement suggestions are welcome! When suggesting enhancements, include:

- **Clear title**: Describe the enhancement
- **Use case**: Why would this be useful?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches you've considered
- **Examples**: Example usage or screenshots if applicable

### 🎵 Feature Ideas

We're particularly interested in:

- Additional OSC commands for Ableton Live
- Support for other DAWs (FL Studio, Logic Pro, etc.)
- MIDI editing capabilities
- Automation recording and editing
- Plugin/device control
- Project file management features
- AI-powered mixing suggestions
- Voice input support
- Web UI for browser control

## Development Setup

### Prerequisites

- Node.js 16+
- Ableton Live 10+ with OSC support
- Git

### Setup Instructions

1. **Fork the repository**

   Click the "Fork" button on GitHub

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/studio-pilot
   cd studio-pilot
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/consigcody94/studio-pilot
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Run tests**

   ```bash
   npm test
   ```

### Development Workflow

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming conventions:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation changes
   - `refactor/` - Code refactoring
   - `test/` - Test additions or changes
   - `chore/` - Build process or tooling changes

2. **Make your changes**

   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   ```bash
   # Run tests
   npm test

   # Run tests with coverage
   npm run test:coverage

   # Type check
   npm run typecheck

   # Lint code
   npm run lint

   # Format code
   npm run format

   # Build
   npm run build
   ```

4. **Commit your changes**

   Use clear, descriptive commit messages:

   ```bash
   git add .
   git commit -m "feat: add support for automation recording"
   ```

   Commit message format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Formatting, missing semicolons, etc.
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Build process or tooling changes

5. **Keep your fork synced**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

   - Go to your fork on GitHub
   - Click "Pull Request"
   - Select your branch
   - Fill out the PR template
   - Submit!

## Pull Request Guidelines

### Before Submitting

- ✅ All tests pass (`npm test`)
- ✅ Code is formatted (`npm run format`)
- ✅ Code is linted (`npm run lint`)
- ✅ Types are correct (`npm run typecheck`)
- ✅ Build succeeds (`npm run build`)
- ✅ Documentation is updated
- ✅ Commit messages are clear and descriptive

### PR Description

Your PR should include:

- **What**: What does this PR do?
- **Why**: Why is this change needed?
- **How**: How does it work?
- **Testing**: How did you test this?
- **Breaking Changes**: Any breaking changes?
- **Screenshots**: If applicable (especially for UI changes)

### PR Template Example

```markdown
## Description
Add support for automation recording in Ableton Live

## Motivation
Users want to record parameter automation directly through Claude

## Changes
- Added `record_automation` MCP tool
- Updated OSC client with automation endpoints
- Added tests for automation recording

## Testing
- Tested with Ableton Live 11.3
- Verified parameter automation records correctly
- Added unit tests (95% coverage)

## Breaking Changes
None

## Checklist
- [x] Tests pass
- [x] Code formatted
- [x] Documentation updated
- [x] Changelog updated
```

## Code Style

### TypeScript Guidelines

- Use TypeScript's `strict` mode
- Prefer `interface` over `type` for object types
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use descriptive variable names
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Create a new track in Ableton Live
 *
 * @param name - Track name
 * @param type - Track type (audio or midi)
 * @param position - Optional track position
 * @returns The created track's ID
 */
async createTrack(name: string, type: 'audio' | 'midi', position?: number): Promise<number> {
  // Implementation
}
```

### Code Organization

- One class/interface per file (except closely related types)
- Group imports: standard library → external → internal
- Order class members: constructor → public → private
- Keep functions focused and small (<50 lines when possible)

### Testing

- Write tests for all new functionality
- Aim for >70% code coverage
- Test both success and error cases
- Use descriptive test names

```typescript
describe('AbletonOSCClient', () => {
  describe('createTrack', () => {
    it('should create a MIDI track with the specified name', async () => {
      // Test implementation
    });

    it('should throw an error if track name is empty', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### README Updates

When adding features, update:
- Feature list
- Usage examples
- Available tools list
- Architecture diagram if needed

### API Documentation

- Add JSDoc comments for all public functions
- Include parameter descriptions
- Include return value descriptions
- Include example usage
- Document thrown errors

### MCP Tool Documentation

When adding new MCP tools, document:
- Tool name and description
- Input schema with all parameters
- Example natural language queries
- Expected behavior
- Edge cases and error handling

## Release Process

Maintainers handle releases:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Publish to npm (if applicable)

## Getting Help

- 💬 [GitHub Discussions](https://github.com/consigcody94/studio-pilot/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/consigcody94/studio-pilot/issues) - Report bugs
- 📧 Email: consigcody94@users.noreply.github.com

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes
- README acknowledgments

Thank you for contributing to studio-pilot! 🎵

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev          # Watch mode
npm test            # Run tests
npm run lint        # Lint code
npm run format      # Format code

# Building
npm run build       # Build for production
npm run typecheck   # Type check only

# Testing
npm test            # Run tests
npm run test:coverage  # With coverage
npm run test:watch  # Watch mode
```

### Project Structure

```
studio-pilot/
├── src/
│   ├── types.ts          # Type definitions
│   ├── osc-client.ts     # OSC communication
│   ├── mcp-server.ts     # MCP protocol server
│   └── index.ts          # Public API
├── tests/                # Test files
├── docs/                 # Additional docs
└── dist/                 # Build output
```

### Important Files

- `README.md` - Main documentation
- `MCP_SETUP.md` - Setup guide
- `CONTRIBUTING.md` - This file
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `jest.config.js` - Test configuration
- `.eslintrc.json` - Linting rules
- `.prettierrc.json` - Code formatting

---

Made with ❤️ by the studio-pilot community
