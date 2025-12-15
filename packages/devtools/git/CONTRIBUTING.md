# Contributing to Commit Craft

Thank you for your interest in contributing to Commit Craft!

## Development Setup

```bash
git clone https://github.com/consigcody94/commit-craft.git
cd commit-craft
npm install
npm run build
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run typecheck && npm run lint`)
5. Commit (`git commit -m 'feat: add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Adding New Tools

1. Add types to `src/types.ts`
2. Implement functionality in appropriate client
3. Add MCP tool definition in `src/mcp-server.ts` `listTools()` method
4. Add tool handler in `callTool()` method
5. Update README.md with tool documentation

## Testing

Before submitting a PR:

```bash
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
npm run build      # Build project
```

## Commit Messages

We use Conventional Commits:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions
- `chore`: Maintenance tasks

Example:
```
feat(pr-review): add security vulnerability detection

Add checks for hardcoded credentials and SQL injection
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
