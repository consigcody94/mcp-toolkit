# Contributing to SiteFast

Thank you for your interest in contributing to SiteFast! 🎉

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** - Describe the issue concisely
- **Steps to reproduce** - Detailed steps to recreate the problem
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Environment** - Node version, OS, browser, etc.
- **Screenshots** - If applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** - Describe the enhancement
- **Use case** - Why this enhancement would be useful
- **Proposed solution** - How you envision it working
- **Alternatives** - Other solutions you've considered

### Pull Requests

1. **Fork the repository**

```bash
git clone https://github.com/YOUR_USERNAME/sitefast.git
cd sitefast
```

2. **Create a branch**

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-fix
```

3. **Make your changes**

- Follow the existing code style
- Add tests if applicable
- Update documentation

4. **Test your changes**

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck --workspace=@sitefast/server
npm run typecheck --workspace=@sitefast/web

# Build both packages
npm run build

# Test manually
npm run dev
```

5. **Commit your changes**

Use conventional commits:

```bash
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve deployment bug"
git commit -m "docs: update README"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

6. **Push to your fork**

```bash
git push origin feature/amazing-feature
```

7. **Open a Pull Request**

- Fill in the PR template
- Link related issues
- Request review

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sitefast.git
cd sitefast

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development servers
npm run dev
```

This starts:
- API Server: `http://localhost:3001`
- Proxy Server: `http://localhost:3000`
- Web Dashboard: `http://localhost:3002`

### Project Structure

```
sitefast/
├── packages/
│   ├── server/     # Backend (Express, SQLite, Build Engine)
│   └── web/        # Frontend (React, Vite, Tailwind)
├── examples/       # Example projects for testing
└── .github/        # GitHub Actions workflows
```

### Testing

Manual testing workflow:

1. Start dev servers: `npm run dev`
2. Open web dashboard: `http://localhost:3002`
3. Test file upload with `examples/static-site`
4. Test Git deployment with public repo
5. Verify deployment at `http://subdomain.localhost:3000`
6. Test redeploy functionality
7. Test project deletion

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing patterns
- **Components**: Keep under 150 lines
- **Functions**: Single responsibility
- **Comments**: Explain "why", not "what"

## Framework Support

When adding support for a new framework:

1. Update `packages/server/src/framework-detector.ts`
   - Add detection logic
   - Define build config

2. Add to framework table in README.md

3. Create example project in `examples/`

4. Test deployment end-to-end

## Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update API documentation
- Add examples for new functionality

## Community

- Be respectful and constructive
- Help others learn
- Share knowledge
- Celebrate successes

## Questions?

Feel free to:
- Open a discussion
- Ask in issues
- Reach out to maintainers

Thank you for making SiteFast better! ⚡
