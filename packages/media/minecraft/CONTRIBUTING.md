# Contributing to Minecraft Pilot

Thank you for your interest in contributing to Minecraft Pilot! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Feature Requests](#feature-requests)
- [Recognition](#recognition)

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat all community members with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Inclusive**: Welcome contributors of all skill levels and backgrounds
- **Be Patient**: Remember that everyone is learning

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## How Can I Contribute?

### Reporting Bugs

Found a bug? Help us fix it!

1. **Search Existing Issues**: Check if the bug has already been reported
2. **Create a New Issue**: If not found, create a detailed bug report
3. **Include Details**:
   - **Description**: Clear summary of the bug
   - **Steps to Reproduce**: Exact steps to trigger the bug
   - **Expected Behavior**: What should happen
   - **Actual Behavior**: What actually happens
   - **Environment**: OS, Node.js version, Minecraft version
   - **Logs**: Relevant error messages or logs
   - **Screenshots**: If applicable

**Bug Report Template**:

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13.0, Windows 11, Ubuntu 22.04]
- Node.js: [e.g., 18.15.0]
- Minecraft Server: [e.g., 1.20.1]
- Minecraft Pilot: [e.g., 1.0.0]

## Logs
```
Paste relevant logs here
```

## Additional Context
Any other relevant information
```

### Suggesting Enhancements

Have an idea for a new feature?

1. **Search Existing Issues**: Check if the feature has been suggested
2. **Create Feature Request**: Use the feature request template
3. **Explain Use Case**: Why is this feature valuable?
4. **Propose Implementation**: How might it work?

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos or grammatical errors
- Clarify confusing sections
- Add missing examples
- Improve organization
- Translate to other languages

### Writing Code

Ready to contribute code? Follow the development workflow below.

## Development Setup

### Prerequisites

- **Node.js** 16+ and npm
- **Git**
- **Minecraft Java Edition Server** (for testing)
- **Code Editor** (VS Code recommended)

### Initial Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/minecraft-pilot.git
cd minecraft-pilot

# Add upstream remote
git remote add upstream https://github.com/consigcody94/minecraft-pilot.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Environment

**Recommended VS Code Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Make Changes

Write your code following the style guidelines below.

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Check TypeScript types
npm run typecheck

# Run all checks
npm run lint && npm run typecheck && npm test
```

### 4. Commit Changes

We use **Conventional Commits** format:

```bash
git add .
git commit -m "feat: add support for Minecraft Bedrock Edition"
```

**Commit Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring (no feature change or bug fix)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

**Commit Message Guidelines**:
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep first line under 72 characters
- Reference issues: `fix: resolve RCON timeout issue (#123)`

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Submit the pull request

## Code Style Guidelines

### TypeScript Guidelines

**Enable Strict Mode**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type Everything**:
```typescript
// Good
function parseCommand(input: string): ParsedCommand {
  const result: ParsedCommand = {
    action: 'give_item',
    parameters: {},
    minecraftCommand: 'give @p diamond 1'
  };
  return result;
}

// Bad
function parseCommand(input) {
  return {
    action: 'give_item',
    parameters: {},
    minecraftCommand: 'give @p diamond 1'
  };
}
```

**Prefer Interfaces Over Type Aliases** (for objects):
```typescript
// Good
interface Player {
  name: string;
  uuid: string;
  position: Position;
}

// Acceptable for unions/intersections
type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator';
```

**Use Const Assertions** (when appropriate):
```typescript
const COMMAND_INTENTS = [
  'give_item',
  'teleport',
  'change_gamemode',
] as const;

type CommandIntent = typeof COMMAND_INTENTS[number];
```

### Code Organization

**File Structure**:
```
src/
├── types.ts              # All type definitions
├── rcon/
│   └── rcon-client.ts    # RCON client implementation
├── parsers/
│   └── command-parser.ts # Natural language parsing
├── mcp-server.ts         # MCP server implementation
└── index.ts              # Public API exports
```

**Naming Conventions**:
- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private members**: Prefix with `private` keyword (no `_` prefix)

### Code Formatting

We use **Prettier** for formatting:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

**Key Rules**:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line length
- Trailing commas in multiline

### Comments and Documentation

**JSDoc for Public APIs**:
```typescript
/**
 * Connect to Minecraft server via RCON
 *
 * @param config - RCON connection configuration
 * @returns Promise that resolves when connected
 * @throws Error if connection fails
 *
 * @example
 * ```typescript
 * const client = new MinecraftRCONClient({
 *   host: 'localhost',
 *   port: 25575,
 *   password: 'secret'
 * });
 * await client.connect();
 * ```
 */
async connect(): Promise<void> {
  // Implementation
}
```

**Inline Comments** (explain *why*, not *what*):
```typescript
// Good - explains reasoning
// Use exponential backoff to avoid overwhelming the server
await sleep(Math.pow(2, attemptNumber) * 1000);

// Bad - states the obvious
// Set connected to true
this.connected = true;
```

### Error Handling

**Always Throw Typed Errors**:
```typescript
// Good
throw new Error(`Failed to connect to RCON: ${error.message}`);

// Bad
throw 'Connection failed';
```

**Provide Context**:
```typescript
try {
  await this.client.send(command);
} catch (error) {
  throw new Error(
    `Failed to execute command "${command}": ${(error as Error).message}`
  );
}
```

## Testing Requirements

### Test Coverage

Aim for **80%+ code coverage**:
- All public APIs must be tested
- Critical paths must be tested
- Edge cases should be tested

### Writing Tests

**Test File Location**:
```
tests/
├── rcon-client.test.ts
├── command-parser.test.ts
└── mcp-server.test.ts
```

**Test Structure**:
```typescript
describe('CommandParser', () => {
  describe('parse', () => {
    it('should parse "give diamond sword" intent', () => {
      const result = CommandParser.parse({
        prompt: 'give Steve a diamond sword'
      });

      expect(result.action).toBe('give_item');
      expect(result.parameters.player).toBe('Steve');
      expect(result.parameters.item).toBe('diamond_sword');
      expect(result.minecraftCommand).toBe('give Steve minecraft:diamond_sword 1');
    });

    it('should handle missing player name', () => {
      const result = CommandParser.parse({
        prompt: 'give a diamond sword'
      });

      expect(result.parameters.player).toBe('@p');
    });

    it('should reject empty prompts', () => {
      expect(() => {
        CommandParser.parse({ prompt: '' });
      }).toThrow('Prompt cannot be empty');
    });
  });
});
```

**Testing Best Practices**:
- **Arrange, Act, Assert**: Structure tests clearly
- **One Assertion Per Test**: Test one thing at a time
- **Descriptive Names**: Test names should explain what is tested
- **Mock External Dependencies**: Don't test RCON library itself
- **Test Both Success and Failure**: Cover happy path and error cases

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- command-parser.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode (during development)
npm run test:watch
```

## Documentation Standards

### README Updates

When adding features, update README.md:

1. **Add to Features List**: Brief description of feature
2. **Add Usage Example**: Show how to use the feature
3. **Update Tools Section**: If adding new MCP tool
4. **Add to Architecture**: If changing structure

### API Documentation

Document all public APIs with JSDoc:

```typescript
/**
 * Parse natural language into Minecraft command
 *
 * Detects user intent and extracts entities (players, items, coordinates)
 * to generate valid Minecraft commands.
 *
 * @param request - Natural language request
 * @returns Parsed command with action, parameters, and Minecraft command string
 *
 * @example
 * ```typescript
 * const result = CommandParser.parse({
 *   prompt: 'give Steve a diamond sword'
 * });
 * console.log(result.minecraftCommand);
 * // Output: "give Steve minecraft:diamond_sword 1"
 * ```
 */
static parse(request: NaturalLanguageRequest): ParsedCommand {
  // Implementation
}
```

### Changelog

Update CHANGELOG.md for significant changes:

```markdown
## [1.1.0] - 2024-11-20

### Added
- Support for Minecraft Bedrock Edition via Websocket protocol
- New `execute_batch` tool for running multiple commands
- Configurable retry logic for failed connections

### Changed
- Improved natural language parsing accuracy
- Updated RCON client timeout defaults

### Fixed
- Connection timeout errors on slow servers
- Player name extraction with special characters

### Security
- Added input sanitization for command injection prevention
```

## Pull Request Process

### Before Submitting

**Checklist**:
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Types check (`npm run typecheck`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] Commit messages follow Conventional Commits
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues
Fixes #123
Closes #456
```

### Review Process

1. **Automated Checks**: CI must pass (tests, linting, type checking)
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Reviewers may test changes locally
4. **Feedback**: Address review comments
5. **Approval**: Once approved, maintainer will merge

### After Merge

- Your contribution will be included in the next release
- You'll be added to CONTRIBUTORS.md
- Consider starring the repo and sharing on social media!

## Issue Guidelines

### Creating Issues

**Good Issue**:
- Clear, descriptive title
- Detailed description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment information
- Relevant logs or screenshots

**Bad Issue**:
- Vague title: "It doesn't work"
- No details: "Getting an error"
- No environment info
- No reproduction steps

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - Will not be worked on

## Feature Requests

### Proposing Features

**Good Feature Request**:
1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: What other solutions did you consider?
4. **Use Cases**: Who would benefit and how?
5. **Implementation**: Any thoughts on implementation?

**Feature Request Template**:

```markdown
## Feature Description
Brief description of the feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other solutions did you consider?

## Use Cases
Who would benefit from this feature and how?

## Implementation Ideas
Any thoughts on how to implement this? (optional)

## Additional Context
Any other relevant information
```

### Feature Development Process

1. **Discussion**: Feature request is discussed in issue
2. **Approval**: Maintainer approves feature for development
3. **Design**: Technical design is proposed (if complex)
4. **Implementation**: Code is written following guidelines
5. **Review**: PR is reviewed and tested
6. **Merge**: Feature is merged and documented

### Popular Feature Ideas

**Looking for ideas?** Consider these areas:

- **Additional Minecraft Commands**: More command support
- **Bedrock Edition Support**: Websocket protocol implementation
- **Multi-Server Management**: Manage multiple servers simultaneously
- **Command Macros**: Reusable command sequences
- **Scheduled Commands**: Cron-like command scheduling
- **Player Activity Monitoring**: Track player actions
- **Server Metrics**: Performance monitoring
- **Web Dashboard**: Browser-based control panel
- **Voice Control**: Speech-to-command integration
- **Internationalization**: Multi-language support

## Recognition

### Contributors

All contributors are recognized in:
- **CONTRIBUTORS.md**: Hall of fame for all contributors
- **GitHub Contributors**: Automatic recognition on repository
- **Release Notes**: Mentioned in release changelogs

### Types of Contributions

We recognize all types of contributions:
- 💻 Code
- 📖 Documentation
- 🐛 Bug Reports
- 💡 Feature Ideas
- 🌍 Translations
- 🎨 Design
- 🧪 Testing
- 💬 Community Support

## Getting Help

Need help contributing?

- **GitHub Discussions**: https://github.com/consigcody94/minecraft-pilot/discussions
- **Discord**: [Join our community](#)
- **Email**: support@example.com

## License

By contributing to Minecraft Pilot, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Minecraft Pilot! 🎮❤️
