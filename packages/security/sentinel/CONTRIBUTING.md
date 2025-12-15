# Contributing to Sentinel AI

Thank you for your interest in contributing to Sentinel AI! This MCP server helps address critical security vulnerabilities in AI-generated code.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members
- Responsible disclosure for security issues

## How to Contribute

### Reporting Security Vulnerabilities

If you discover a security vulnerability in Sentinel AI itself:

1. **DO NOT** open a public issue
2. Email the maintainers directly (check repository for contact)
3. Include detailed steps to reproduce
4. Allow time for a fix before public disclosure

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Sample code** that triggers false positive/negative
- **Environment details** (Node.js version, OS)
- **Error messages** and stack traces

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

- **Clear title and description**
- **Use case** - what security issue does this address?
- **Proposed pattern** if adding new detection
- **Research/references** supporting the vulnerability
- **OWASP mapping** if applicable

### Adding New Security Patterns

When proposing new vulnerability patterns:

1. **Research**: Link to CVEs, research papers, or OWASP
2. **Regex Pattern**: Provide tested regular expression
3. **Test Cases**: Both positive and negative examples
4. **Severity Justification**: Explain severity level
5. **Recommendations**: Clear remediation guidance
6. **False Positive Rate**: Estimate and mitigation strategy

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Add security patterns** to `SECURITY_PATTERNS` array
4. **Test thoroughly** with real-world code samples
5. **Update documentation** including README examples
6. **Ensure TypeScript compiles** without errors (`npm run build`)
7. **Test with MCP client** (like Claude Desktop)
8. **Commit your changes** with clear commit messages
9. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Follow existing code style and conventions
- Write clear, concise commit messages
- Update README.md with new patterns or features
- Document OWASP mapping for new vulnerabilities
- Provide test cases demonstrating detection
- Add yourself to contributors list if you'd like

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sentinel-ai.git
cd sentinel-ai

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
- **Comments** - explain complex regex patterns

### TypeScript Guidelines

```typescript
// Good - explicit types, clear intent
interface SecurityPattern {
  pattern: RegExp;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  recommendation: string;
  owaspCategory?: string;
}

// Avoid - implicit any, unclear types
const pattern = {
  pattern: /something/,
  severity: "high",
};
```

### Adding Security Patterns

```typescript
// Template for new patterns
{
  pattern: /your-regex-pattern/gi,
  type: "vulnerability_type",
  severity: "high", // critical, high, medium, low, info
  message: "Clear description of the vulnerability",
  recommendation: "Specific remediation steps",
  owaspCategory: "A03:2021 - Injection", // OWASP 2021 mapping
}
```

### Regex Pattern Guidelines

- Use case-insensitive flag (`/gi`) when appropriate
- Avoid overly broad patterns (minimize false positives)
- Test against common frameworks and libraries
- Consider language-specific syntax variations
- Document complex patterns with comments

## Testing

When adding new patterns or features:

1. **Positive Tests**: Ensure vulnerable code is detected
2. **Negative Tests**: Ensure safe code isn't flagged
3. **Edge Cases**: Test unusual but valid code patterns
4. **Performance**: Test with large files (> 10MB)
5. **Multiple Languages**: Test across supported languages

### Test Checklist

- [ ] Pattern detects intended vulnerability
- [ ] Pattern doesn't flag safe alternative
- [ ] Severity level is appropriate
- [ ] Recommendation is actionable
- [ ] OWASP category is correct
- [ ] Works across supported file types
- [ ] No catastrophic backtracking in regex

## Commit Messages

Follow these guidelines for commit messages:

```
type: brief description

More detailed explanation if needed.

Fixes #123
```

Types:
- `feat`: New security pattern or feature
- `fix`: Fix false positive/negative
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `perf`: Performance improvements
- `chore`: Maintenance tasks

Examples:
```
feat: add detection for prototype pollution

fix: reduce false positives in SQL injection pattern

docs: update OWASP mappings to 2021

perf: optimize regex patterns for large files
```

## Project Structure

```
sentinel-ai/
├── src/
│   └── index.ts          # Main implementation with patterns
├── dist/                 # Compiled JavaScript (generated)
├── README.md             # User documentation
├── CONTRIBUTING.md       # This file
├── LICENSE               # MIT license
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Security Pattern Categories

Organize patterns by category:

1. **Secrets & Credentials** (Critical)
   - API keys, passwords, tokens
   - Private keys
   - Cloud credentials

2. **Injection Vulnerabilities** (Critical/High)
   - SQL injection
   - Command injection
   - XSS
   - Template injection

3. **Cryptographic Issues** (Medium/High)
   - Weak algorithms
   - Insecure random
   - Hardcoded cryptographic keys

4. **Access Control** (High)
   - Path traversal
   - Authentication bypass
   - Authorization issues

5. **Configuration Issues** (Medium)
   - CORS misconfiguration
   - Debug mode enabled
   - Verbose errors

## Severity Guidelines

**Critical**:
- Direct code execution
- Authentication bypass
- Hardcoded secrets
- Command injection

**High**:
- SQL injection
- XSS
- Path traversal
- SSRF
- Insecure deserialization

**Medium**:
- Weak cryptography
- CORS issues
- Information disclosure
- Security TODOs

**Low**:
- Debug logging
- Code quality issues with security implications

## OWASP Mapping

Map all patterns to OWASP Top 10 2021:
- A01:2021 - Broken Access Control
- A02:2021 - Cryptographic Failures
- A03:2021 - Injection
- A04:2021 - Insecure Design
- A05:2021 - Security Misconfiguration
- A06:2021 - Vulnerable and Outdated Components
- A07:2021 - Identification and Authentication Failures
- A08:2021 - Software and Data Integrity Failures
- A09:2021 - Security Logging and Monitoring Failures
- A10:2021 - Server-Side Request Forgery

## Documentation

When adding features:

1. Update README.md with examples
2. Add pattern to "Detected Vulnerabilities" section
3. Document OWASP mapping
4. Provide real-world example
5. Add troubleshooting tips if needed

## Performance Considerations

- **Regex Optimization**: Avoid catastrophic backtracking
- **Memory Usage**: Stream large files when possible
- **Scanning Speed**: Maintain > 500 files/second
- **Pattern Compilation**: Compile regex once, reuse

## False Positive Management

Strategies to reduce false positives:

1. **Context Awareness**: Check surrounding code
2. **Framework Detection**: Recognize safe framework patterns
3. **Configuration**: Allow pattern customization
4. **Severity Tuning**: Use appropriate severity levels
5. **Documentation**: Explain why pattern is flagged

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run security audit (`npm audit`)
4. Create git tag
5. Publish to npm (if applicable)
6. Create GitHub release

## Feature Ideas

We're particularly interested in:

- New vulnerability patterns with research backing
- Language-specific security checks
- Framework-aware detection (React, Vue, Express, etc.)
- AI-specific vulnerability patterns
- Performance optimizations
- Configuration file support
- Custom pattern plugins

## Questions?

Feel free to open an issue with the `question` label.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Security Hall of Fame for vulnerability reports
- Project README (optional)

## Impact

Remember, Sentinel AI addresses a real problem: AI-generated code has 322% more privilege escalation vulnerabilities. Your contributions help developers worldwide write more secure code.

Thank you for contributing to Sentinel AI!
