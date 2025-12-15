# Contributing to Tarkov Tracker

First off, thank you for considering contributing to Tarkov Tracker! It's people like you that make this tool better for the entire Tarkov community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:
- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **System info**: Windows version, Node.js version, etc.

### Suggesting Features

Feature suggestions are welcome! Please include:
- **Clear description** of the feature
- **Use case** - why is this useful?
- **Possible implementation** approach (optional)

### Map Calibration

One of the most valuable contributions is improving map calibration! If markers appear offset:

1. Take screenshots at known locations
2. Note the game coordinates from filename
3. Compare with expected map position
4. Submit a PR with improved `gameToMap` values

### Code Contributions

#### Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers!

#### Areas Needing Help

- 🗺️ Map calibration values
- 🌐 Translations/i18n
- 🧪 Test coverage
- 📖 Documentation improvements
- 🎨 UI/UX enhancements

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- Windows 10/11 (for full testing)

### Getting Started

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/tarkov-tracker.git
cd tarkov-tracker

# Install dependencies
npm install

# Start development mode
npm run electron:dev

# In a separate terminal, start the MCP server
npm run mcp-server
```

### Project Structure

```
tarkov-tracker/
├── electron/          # Main process (Node.js)
├── mcp-server/        # MCP server for AI integration
├── src/renderer/      # React frontend
│   ├── components/    # UI components
│   ├── store.ts       # State management
│   └── globals.css    # Styles
└── package.json
```

### Testing Without EFT

You can test the app without the game by:
1. Creating fake screenshot files with valid coordinate filenames
2. Placing them in `Documents/Escape From Tarkov/Screenshots/`

Example filename:
```
2025-12-04[15-32]_100.0, 5.0, -200.0_0.0, 0.7, 0.0, 0.7_0.0 (0).png
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test thoroughly
4. **Commit** with clear messages: `git commit -m "Add amazing feature"`
5. **Push**: `git push origin feature/amazing-feature`
6. **Open a PR** with a clear description

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added comments for complex logic
- [ ] Updated documentation if needed
- [ ] No console errors or warnings
- [ ] Tested on Windows

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new code
- Use meaningful variable names
- Add JSDoc comments for functions
- Prefer `const` over `let`
- Use async/await over raw promises

### React Components

- Functional components with hooks
- Props interface defined with TypeScript
- Keep components focused and small
- Use Tailwind CSS for styling

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat: add boss spawn timer overlay
fix: correct Woods map calibration
docs: update installation instructions
```

### CSS/Tailwind

- Use Tailwind utility classes
- Custom CSS only when necessary
- Follow existing color scheme (gold accents)
- Maintain dark theme consistency

## Questions?

Feel free to open a Discussion on GitHub or reach out to maintainers.

Thank you for contributing! 🎯
