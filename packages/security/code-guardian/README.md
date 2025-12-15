# 🛡️ Code Guardian

**Security scanner specifically designed for AI-generated code**

[![CI](https://github.com/consigcody94/code-guardian/actions/workflows/ci.yml/badge.svg)](https://github.com/consigcody94/code-guardian/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-≥18-green)](https://nodejs.org/)

Stop deploying vulnerable AI-generated code. Code Guardian detects the security patterns that AI assistants commonly introduce, providing instant feedback with actionable recommendations.

## 🔥 Why Code Guardian?

Research shows AI-generated code has:
- **322% more privilege escalation vulnerabilities**
- **153% more design flaws**
- **40% increase in exposed secrets** (hardcoded credentials, API keys)
- **60% of teams have ZERO review processes** for AI code

Code Guardian fills this critical gap with specialized detection for AI-common vulnerabilities.

## ✨ Features

### 🎯 AI-Specific Detection
- **42+ Security Patterns** covering OWASP Top 10
- **AI Code Heuristics** - detects likely AI-generated code
- **Trust Score** (0-100) for overall code security
- **Risk Level** assessment (safe → critical)

### 🔍 Vulnerability Categories
- **Secrets & Credentials** - AWS keys, GitHub tokens, API keys, passwords, JWT secrets
- **SQL Injection** - String concatenation, dynamic queries
- **XSS** - dangerouslySetInnerHTML, innerHTML, document.write
- **Command Injection** - exec(), eval(), Function constructor
- **Path Traversal** - Unsanitized file paths
- **Privilege Escalation** - Hardcoded admin checks, client-side auth
- **Insecure Deserialization** - Unsafe JSON parsing
- **Weak Cryptography** - MD5/SHA1, Math.random(), hardcoded IV/salt
- **Unsafe Regex** - ReDoS vulnerabilities
- **SSRF** - Server-side request forgery
- **XXE** - XML external entity injection
- **Mass Assignment** - Direct model updates from request body
- **Timing Attacks** - Non-constant time comparisons

### 📊 Multiple Output Formats
- **Terminal** - Beautiful colored output with recommendations
- **JSON** - For programmatic processing
- **SARIF** - GitHub Code Scanning integration

### ⚡ Developer Experience
- **Fast** - Scans 1000s of files in seconds
- **Zero Config** - Works out of the box
- **CI/CD Ready** - Exit codes for pipeline integration
- **Detailed Reports** - File, line, column, CWE, OWASP references

## 📦 Installation

```bash
npm install -g code-guardian
```

Or use with npx:

```bash
npx code-guardian scan .
```

## 🚀 Quick Start

### Scan Current Directory
```bash
code-guardian scan .
```

### Scan Specific Files
```bash
code-guardian scan src/api src/auth
```

### Filter by Severity
```bash
code-guardian scan . --severity critical high
```

### CI/CD Integration
```bash
# Fail build on high or critical issues
code-guardian scan . --fail-on high --format json --output report.json
```

### With AI Detection
```bash
# Include AI code heuristics
code-guardian scan . --ai-heuristics
```

## 📚 Documentation

- **[Examples](EXAMPLES.md)** - Real vulnerability examples with fixes
- **[Security Policy](SECURITY.md)** - Responsible disclosure
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## 📊 Example Output

See [EXAMPLES.md](EXAMPLES.md) for comprehensive examples.

## 🔗 Integration Examples

### GitHub Actions

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npx code-guardian scan . --format sarif --output results.sarif
      - uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

## 📄 License

MIT - see [LICENSE](LICENSE)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## ⭐ Star History

If Code Guardian helps you ship more secure code, give it a star! ⭐

---

**Built for developers who use AI tools and want to ship secure code.**

Stop the 322% privilege escalation increase. Scan your AI-generated code today.
