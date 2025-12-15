# Conventional Commit Templates

## Quick Reference

### Features
```
feat: add user authentication system
feat(api): implement GraphQL mutations for posts
feat!: redesign navigation (breaking change)
```

### Bug Fixes
```
fix: resolve memory leak in image processing
fix(ui): correct button alignment on mobile
fix: patch XSS vulnerability in comment forms
```

### Documentation
```
docs: update API reference for v2.0
docs(readme): add installation instructions
docs: fix typos in contributing guide
```

### Code Quality
```
refactor: simplify authentication logic
refactor(utils): extract common validation functions
style: apply Prettier formatting
```

### Tests
```
test: add unit tests for payment service
test(e2e): cover checkout flow
test: increase coverage to 85%
```

### Performance
```
perf: optimize database queries
perf(images): implement lazy loading
perf: reduce bundle size by 40%
```

### Chores
```
chore: upgrade dependencies
chore(deps): bump react from 17 to 18
chore: update CI/CD pipeline
```

## Full Examples

### Breaking Change
```
feat!: migrate to TypeScript

BREAKING CHANGE: All .js files converted to .ts
- Consumers must update imports
- Type definitions now required
- See migration guide: docs/MIGRATION.md
```

### With Body and Footer
```
fix: prevent race condition in user login

The login flow had a race condition where multiple
rapid login attempts could create duplicate sessions.

Added mutex locking around session creation.
Increased session creation test coverage to 95%.

Closes #234
Reviewed-by: Jane Doe
```

### Multi-line Description
```
feat: add comprehensive user profile

Implemented full user profile system:
- Profile editing with validation
- Avatar upload with crop/resize
- Bio with markdown support
- Social links management
- Privacy settings

Closes #45, #67, #89
```

## Scope Examples

```
feat(auth): add OAuth2 support
fix(cart): resolve checkout calculation error
docs(api): document rate limiting
test(payments): add Stripe integration tests
chore(ci): add automated security scans
refactor(database): optimize query performance
style(components): apply new design system
```

## commit-craft Usage

### Interactive Mode
```bash
# commit-craft guides you through questions
commit-craft commit
```

### Quick Mode
```bash
# Shorthand for feature
ccreate "user authentication"

# Fix with scope
cfix cart "resolve checkout error"

# Breaking change
ccreate! "migrate to v2 API"
```

### Review PRs
```bash
# Automated PR review with security & performance checks
commit-craft review 123
```

### Generate Changelog
```bash
# Auto-generate from conventional commits
commit-craft changelog
```

## Best Practices

1. **Subject line**: 50 chars or less
2. **Body**: Wrap at 72 chars
3. **Use imperative mood**: "add" not "added"
4. **Reference issues**: "Closes #123"
5. **Explain why, not what**: Code shows what changed
6. **Breaking changes**: Always use `!` and `BREAKING CHANGE:`

## Common Mistakes

❌ `fix bug in login`
✅ `fix(auth): resolve session timeout issue`

❌ `updated readme`
✅ `docs(readme): add installation instructions`

❌ `WIP commit`
✅ `feat(api): implement user endpoints (WIP)`

❌ `fixed stuff`
✅ `fix: resolve null pointer in payment processing`
