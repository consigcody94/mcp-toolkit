# Contributing to Data Transform

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/consigcody94/data-transform.git
cd data-transform
npm install
npm run build
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

## Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Run tests and linting (`npm run typecheck && npm run lint`)
5. Commit (`git commit -m 'feat: add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open Pull Request

## Adding New Formats

1. Add format type to `src/types.ts`
2. Implement parser in `src/converter.ts`
3. Add converter method for format
4. Update README with format documentation
5. Add tests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
