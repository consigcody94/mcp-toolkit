# Contributing to Model Forge 3D

Thank you for your interest in contributing! We welcome contributions from the community.

---

## 📋 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and beginners
- Focus on constructive feedback
- Keep discussions professional

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/your-username/model-forge-3d.git
cd model-forge-3d
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes

- Write clear, commented code
- Follow existing code style
- Add tests for new features
- Update documentation

### 4. Test Your Changes

```bash
npm test                  # Run all tests
npm run typecheck         # Type checking
npm run lint              # Linting
npm run build             # Build check
```

### 5. Commit

Use conventional commit messages:

```bash
git commit -m "feat: add new texture generation feature"
git commit -m "fix: resolve mesh export bug"
git commit -m "docs: update installation guide"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance

### 6. Push & Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:
- Clear title and description
- Screenshots (if UI changes)
- Test results
- Related issue numbers

---

## 🎯 Development Guidelines

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` types
- Export types from `types.ts`

### Testing

- Write tests for new features
- Maintain >80% code coverage
- Test edge cases and error handling
- Use descriptive test names

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Keep functions small and focused
- Add JSDoc comments for public APIs

### Documentation

- Update README for new features
- Add inline comments for complex logic
- Create examples for new capabilities
- Keep docs in sync with code

---

## 🐛 Reporting Bugs

**Before submitting:**
1. Check existing issues
2. Test with latest version
3. Verify it's not a configuration issue

**Include:**
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs
- Minimal reproduction example

---

## 💡 Suggesting Features

**Before suggesting:**
1. Check existing feature requests
2. Verify it fits project scope
3. Consider implementation complexity

**Include:**
- Clear use case
- Expected behavior
- Mockups/examples (if applicable)
- Alternative approaches considered

---

## 🏗️ Architecture

### Directory Structure

```
src/
├── mcp-server.ts           # MCP protocol implementation
├── types.ts                # TypeScript type definitions
├── generators/             # Generation engines
│   └── model-generator.ts  # Core generation logic
└── utils/                  # Utility functions
    ├── validation.ts       # Input validation
    ├── logger.ts           # Logging
    └── id-generator.ts     # ID generation
```

### Key Concepts

**MCP Protocol:**
- JSON-RPC 2.0 over stdin/stdout
- Tool-based interface
- Async request handling

**Generation Pipeline:**
1. Validate input
2. Select AI model
3. Generate mesh
4. Optimize & process
5. Export to formats
6. Return result

---

## 🧪 Testing Guidelines

### Unit Tests

```typescript
describe('YourFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = ...;

    // Act
    const result = ...;

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Test complete workflows:
- Text prompt → FBX export
- Model generation → Validation
- Error handling → Recovery

---

## 📦 Release Process

1. **Version bump** - Update `package.json`
2. **Changelog** - Document changes
3. **Test** - Full test suite passes
4. **Tag** - `git tag v1.0.0`
5. **Push** - `git push --tags`
6. **Release** - GitHub release with notes

---

## 🤝 Review Process

**What we look for:**
- ✅ Tests pass
- ✅ Code follows style guide
- ✅ Documentation updated
- ✅ No breaking changes (unless major version)
- ✅ Clear commit messages

**Timeline:**
- Initial review: 1-3 days
- Feedback addressed: 1-2 days
- Final approval: 1 day
- Merge: Same day

---

## 🎁 Recognition

Contributors are recognized in:
- README acknowledgments
- Release notes
- GitHub contributors page

Significant contributions earn:
- Collaborator access
- Early feature access
- Community recognition

---

## 📞 Getting Help

- **Questions:** GitHub Discussions
- **Bugs:** GitHub Issues
- **Chat:** Community Discord (coming soon)

---

**Thank you for contributing to Model Forge 3D!** 🚀
