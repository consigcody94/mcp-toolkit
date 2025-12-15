# Worktree Wizard Examples

## Common Workflows

### 1. Fix a Bug While Working on a Feature

```bash
# You're working on feature-x
cd ~/projects/myapp

# Urgent bug reported!
wt new hotfix/critical-bug

# Work on the hotfix in new worktree
cd ../myapp-hotfix-critical-bug
# Fix the bug, commit, push

# Switch back to feature work
cd ~/projects/myapp
```

### 2. Review a Pull Request

```bash
# Create worktree for PR review
wt new pr/review-123

# Review changes
cd ../myapp-pr-review-123
npm test
npm run build

# Back to your work
wt switch
# Select your original branch
```

### 3. Run Tests Across Multiple Branches

```bash
# Run tests on all worktrees
wt exec "npm test"

# Run in parallel
wt exec --parallel "npm install && npm test"
```

### 4. Clean Up Old Worktrees

```bash
# See stale worktrees (90+ days inactive)
wt clean --dry-run

# Remove them
wt clean
```

### 5. Compare Implementations

```bash
# Implementation approach A
wt new approach-a
cd ../myapp-approach-a
# Implement...

# Implementation approach B
wt new approach-b
cd ../myapp-approach-b
# Implement...

# Compare
code ../myapp-approach-a ../myapp-approach-b
```

## Tips & Tricks

- **Quick switch**: `wt sw` then fuzzy search
- **List with status**: `wt ls` shows real-time git status
- **Parallel execution**: `wt exec --parallel` for speed
- **VS Code integration**: Auto-opens in VS Code after creation

## Configuration

Create `.worktree-wizard.json`:

```json
{
  "defaultPath": "../",
  "autoVSCode": true,
  "staleDays": 90
}
```
