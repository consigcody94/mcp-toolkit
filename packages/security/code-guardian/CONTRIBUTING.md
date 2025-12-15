# Contributing to Code Guardian

Thank you for your interest in contributing to Code Guardian! This guide will help you get started.

## 🎯 Ways to Contribute

- **Report Bugs** - Found a false positive or missing vulnerability? Open an issue
- **Suggest Patterns** - Know a security pattern AI commonly gets wrong? We want to hear about it
- **Improve Documentation** - Help make our docs clearer
- **Add Features** - New output formats, IDE integrations, etc.
- **Write Tests** - Increase our coverage

## 🛠️ Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/code-guardian.git
cd code-guardian

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Test locally
code-guardian scan .
```

## 📝 Adding New Security Patterns

Security patterns live in `src/patterns.ts`. To add a new pattern:

```typescript
{
  id: 'SEC-999',  // Unique ID
  name: 'Pattern Name',
  category: 'secrets', // or sql-injection, xss, etc.
  severity: 'critical', // critical, high, medium, low, info
  pattern: /your-regex-here/gi,
  description: 'Clear description of the vulnerability',
  recommendation: 'How to fix it',
  cwe: 'CWE-XXX', // Optional: CWE reference
  owasp: 'A0X:2021 – Name', // Optional: OWASP Top 10
}
```

### Pattern Guidelines

- **Be specific** - Avoid false positives with precise regex
- **Test thoroughly** - Test against real codebases
- **Document well** - Clear description and actionable recommendation
- **Include references** - Add CWE/OWASP when applicable

## 🧪 Testing Your Changes

```bash
# Build
npm run build

# Test on real code
code-guardian scan /path/to/test/project

# Check different formats
code-guardian scan . --format json
code-guardian scan . --format sarif
```

## 📋 Pull Request Process

1. **Fork** the repository
2. **Create a branch** - `git checkout -b feature/your-feature-name`
3. **Make changes** - Follow TypeScript strict mode
4. **Build** - Ensure `npm run build` succeeds
5. **Test** - Verify your changes work as expected
6. **Commit** - Use conventional commits (e.g., `feat:`, `fix:`, `docs:`)
7. **Push** - `git push origin feature/your-feature-name`
8. **Open PR** - Describe what you changed and why

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

Examples:
```
feat(patterns): add detection for hardcoded Firebase credentials

fix(scanner): resolve false positive in SQL injection detection

docs(readme): add example for GitHub Actions integration
```

## 🎨 Code Style

- **TypeScript strict mode** - All code must pass strict type checking
- **ESLint** - Follow existing lint rules
- **Prettier** - Format code consistently
- **Comments** - Explain _why_, not _what_

## 🐛 Bug Reports

When reporting bugs, please include:

- **Code Guardian version** - `code-guardian --version`
- **Node version** - `node --version`
- **OS** - Windows/macOS/Linux
- **Code sample** - Minimal reproducible example
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Scan output** - Full terminal output

## 💡 Feature Requests

For feature requests, please describe:

- **Problem** - What problem does this solve?
- **Proposed solution** - How would it work?
- **Alternatives** - Other approaches you've considered
- **Use cases** - Real-world scenarios

## 🔒 Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead, please report them privately to the maintainers.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the README and release notes.

## 📞 Questions?

- Open a GitHub Discussion
- Check existing issues
- Review the README

Thank you for making Code Guardian better! 🛡️
