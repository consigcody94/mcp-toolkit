# Contributing to Office Whisperer

Thank you for your interest in contributing to Office Whisperer! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/office-whisperer.git
   cd office-whisperer
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

### Format
```bash
npm run format
```

## 📝 Pull Request Process

1. **Update Documentation** - Add/update README for new features
2. **Test Your Changes** - Ensure TypeScript compiles without errors
3. **Follow Code Style** - Run `npm run lint` and `npm run format`
4. **Write Clear Commits** - Use conventional commit messages
5. **Submit PR** - Provide clear description of changes

## 💡 Feature Ideas

- **Outlook Integration** - Email automation via Microsoft Graph API
- **Advanced Charts** - More chart types and customization options
- **Template Library** - Pre-built templates for common use cases
- **Batch Operations** - Process multiple files at once
- **Cloud Integration** - OneDrive/SharePoint file operations
- **Macro Support** - VBA macro generation and execution
- **PDF Export** - Convert Office files to PDF format
- **Data Import** - Import from databases, APIs, and CSVs

## 🐛 Bug Reports

Include:
- **Description** - Clear and concise description of the bug
- **Steps to Reproduce** - How to reproduce the behavior
- **Expected Behavior** - What you expected to happen
- **Actual Behavior** - What actually happened
- **Environment** - OS, Node.js version, Claude Desktop version

## 🌟 Enhancement Suggestions

Include:
- **Use Case** - What problem does this solve?
- **Proposed Solution** - How should it work?
- **Alternatives** - What other approaches did you consider?
- **Impact** - Who benefits from this enhancement?

## 📚 Code Style

- **TypeScript** - Use strict mode, avoid `any` types
- **Naming** - camelCase for variables/functions, PascalCase for classes/types
- **Comments** - Explain why, not what (code should be self-documenting)
- **Imports** - Use ES6 module syntax with `.js` extensions
- **Formatting** - 2 spaces, single quotes, trailing commas

## 🎯 Testing Guidelines

- **Type Safety** - All code must compile with TypeScript strict mode
- **Error Handling** - Validate inputs, provide clear error messages
- **Edge Cases** - Test with empty data, large datasets, special characters
- **Cross-Platform** - Ensure compatibility with Windows, macOS, Linux

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Office Whisperer! 🎯
