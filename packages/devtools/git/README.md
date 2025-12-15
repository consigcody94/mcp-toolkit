# 🎨 Commit Craft

**Complete git workflow automation via Model Context Protocol for Claude Desktop**

Commit Craft is an MCP server that brings AI-powered git workflow automation to Claude Desktop. Craft perfect commits, automate PR reviews, and manage releases—all through natural language.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### Commit Crafting
- **Smart Analysis**: Analyze staged changes with pattern detection and impact assessment
- **Conventional Commits**: Generate and validate conventional commit messages
- **Commit Suggestions**: AI-powered suggestions based on file changes
- **Interactive Building**: Craft commits with type, scope, subject, body, and footer
- **Validation**: Ensure messages follow conventional commits specification

### PR Review & Management
- **Automated Review**: Analyze PRs with security, performance, and style checks
- **Review Suggestions**: Categorized suggestions (critical, warning, info, nitpick)
- **PR Creation**: Create pull requests with generated descriptions
- **Review Submission**: Approve, request changes, or comment on PRs
- **Merge Control**: Merge PRs with squash, rebase, or merge strategies
- **CI/CD Status**: Check build status and test results

### Release Management
- **Semantic Versioning**: Auto-calculate next version from commits
- **Changelog Generation**: Generate changelog from conventional commits
- **Release Creation**: Create GitHub releases with notes
- **Version Bumping**: Smart version incrementing (major/minor/patch)

### Git Operations
- **Branch Management**: Create, checkout, and list branches
- **Status Tracking**: View staged/unstaged changes with diffs
- **Commit History**: Browse commit log with formatting
- **Push/Pull**: Remote operations with error handling

## 🚀 Quick Start

### Prerequisites

- **Claude Desktop** installed
- **Node.js** 16+ and npm
- **Git** repository
- **GitHub** account (for PR/release features)

### Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/commit-craft.git
cd commit-craft

# Install dependencies
npm install

# Build the project
npm run build
```

### Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "commit-craft": {
      "command": "node",
      "args": ["/absolute/path/to/commit-craft/dist/mcp-server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Get GitHub Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`
4. Copy token and add to config

### Restart Claude Desktop

Completely quit and reopen Claude Desktop to load the MCP server.

## 💬 Usage Examples

### Commit Workflow

```
"Analyze my staged changes"
→ Shows file changes, patterns, scopes, and commit suggestions

"Craft a feat commit for adding user authentication"
→ Generates properly formatted conventional commit

"Validate this commit message: feat(auth): add JWT authentication"
→ Checks if message follows conventional commits spec

"Create a commit with the message: fix(api): resolve timeout issue"
→ Creates the commit with staged changes
```

### PR Management

```
"Setup GitHub for owner/repo"
→ Connect to GitHub repository

"List open pull requests"
→ Shows all open PRs with status

"Review PR #42"
→ Analyzes PR with security, performance, and style suggestions

"Approve PR #42 with comment: LGTM, great work!"
→ Submits approval review

"Check CI status for PR #42"
→ Shows build and test status

"Merge PR #42 using squash"
→ Squashes and merges the pull request
```

### Release Management

```
"Calculate next version"
→ Analyzes commits to determine major/minor/patch bump

"Generate changelog since v1.0.0"
→ Creates formatted changelog with features, fixes, breaking changes

"Create release v1.1.0 with changelog"
→ Creates GitHub release with generated notes
```

### Branch Operations

```
"List all branches"
→ Shows branches with current indicator

"Create feature/new-ui branch and checkout"
→ Creates and switches to new branch

"Show git status"
→ Displays staged/unstaged changes

"Show diff for staged changes"
→ Shows file-by-file changes with line counts
```

## 🛠️ Available Tools

### Git Tools (9 tools)

| Tool | Description |
|------|-------------|
| `git_status` | Get repository status with staged/unstaged changes |
| `git_log` | View commit history with author and date |
| `git_diff` | Show diff for staged or unstaged changes |
| `list_branches` | List all branches with current indicator |
| `create_branch` | Create new branch with optional checkout |
| `checkout_branch` | Switch to different branch |
| `analyze_changes` | Analyze staged changes and suggest commits |
| `craft_commit` | Create conventional commit message |
| `validate_commit` | Validate commit message format |

### Commit Tools (2 tools)

| Tool | Description |
|------|-------------|
| `craft_commit` | Generate conventional commit with type, scope, subject, body |
| `create_commit` | Create commit with message or amend last commit |

### GitHub Tools (9 tools)

| Tool | Description |
|------|-------------|
| `setup_github` | Connect to GitHub repository |
| `list_prs` | List PRs by state (open/closed/all) |
| `get_pr` | Get detailed PR information |
| `create_pr` | Create new pull request |
| `review_pr` | Analyze PR and generate review |
| `submit_review` | Submit review (approve/request changes/comment) |
| `merge_pr` | Merge PR with method (merge/squash/rebase) |
| `check_ci_status` | Check CI/CD build status |
| `list_releases` | List GitHub releases |

### Release Tools (3 tools)

| Tool | Description |
|------|-------------|
| `create_release` | Create GitHub release with version and notes |
| `bump_version` | Calculate next semantic version |
| `generate_changelog` | Generate changelog from commits |

## 🏗️ Architecture

### Project Structure

```
commit-craft/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── git/
│   │   └── git-client.ts     # Git operations wrapper (simple-git)
│   ├── github/
│   │   └── github-client.ts  # GitHub API wrapper (Octokit)
│   ├── parsers/
│   │   ├── commit-analyzer.ts # Commit analysis and suggestions
│   │   └── pr-analyzer.ts     # PR review and analysis
│   ├── mcp-server.ts         # MCP protocol server
│   └── index.ts              # Public API exports
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Components

**Git Client** (`git/git-client.ts`):
- Wraps `simple-git` library for Git operations
- Repository status, commit history, diffs
- Branch management, staging, committing
- Tag creation and push/pull operations

**GitHub Client** (`github/github-client.ts`):
- Wraps `@octokit/rest` for GitHub API
- PR creation, review, merge operations
- Release management and listing
- Check runs and CI/CD status
- Repository information

**Commit Analyzer** (`parsers/commit-analyzer.ts`):
- File change analysis and pattern detection
- Scope detection from file paths
- Impact assessment (major/minor/patch)
- Conventional commit formatting
- Message validation
- Changelog entry generation

**PR Analyzer** (`parsers/pr-analyzer.ts`):
- Security checks (hardcoded credentials, SQL injection, eval usage)
- Performance checks (sync operations, nested loops)
- Style checks (console.log, TODO comments, line length)
- Test coverage analysis
- Documentation analysis
- Best practices validation

**MCP Server** (`mcp-server.ts`):
- JSON-RPC 2.0 protocol over stdin/stdout
- 23 MCP tools for complete workflow automation
- Markdown-formatted responses
- Error handling and recovery

## 🎯 Use Cases

### For Individual Developers
- Craft perfect commits every time
- Learn conventional commits through AI guidance
- Automate PR reviews to catch issues early
- Generate changelogs automatically

### For Teams
- Enforce conventional commits across team
- Standardize PR review process
- Automate release notes generation
- Maintain consistent git history

### For Open Source Maintainers
- Review PRs faster with AI assistance
- Generate professional release notes
- Maintain clean commit history
- Automate changelog updates

## 🔧 Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run format
```

## 📝 Conventional Commits Reference

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature/fix
- `perf`: Performance improvements
- `test`: Test additions or updates
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```
feat(auth): add JWT authentication

Implement JWT-based authentication with refresh tokens.
Supports automatic token refresh and secure storage.

Closes #123
```

```
fix(api): resolve timeout issue in user endpoint

The user endpoint was timing out due to inefficient query.
Optimized with indexed lookup and query caching.
```

```
refactor(ui)!: migrate to new component library

BREAKING CHANGE: Old components removed, update imports
```

## 🐛 Troubleshooting

### "Failed to connect to GitHub"

**Cause**: Invalid or missing GitHub token.

**Solutions**:
1. Verify token in Claude Desktop config
2. Check token has `repo` and `workflow` scopes
3. Regenerate token if expired
4. Test token: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user`

### "Repository not configured"

**Cause**: GitHub client not initialized.

**Solutions**:
1. Run `setup_github` tool first with owner and repo
2. Verify repository exists and is accessible
3. Check token has access to repository

### "No staged changes to analyze"

**Cause**: No files staged for commit.

**Solutions**:
1. Stage files first: `git add <files>`
2. Verify staging: `git status`
3. Use commit-craft after staging

### Tools Not Showing in Claude Desktop

**Cause**: Claude Desktop hasn't loaded the MCP server.

**Solutions**:
1. Check config path is correct
2. Verify absolute path to `mcp-server.js`
3. Completely restart Claude Desktop (Quit, not just close)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\\Claude\\logs\\`
   - Linux: `~/.config/Claude/logs/`

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Model Context Protocol](https://github.com/anthropics/mcp)
- [simple-git](https://github.com/steveukx/git-js)
- [Octokit](https://github.com/octokit/rest.js)
- [Claude Desktop](https://claude.ai/download)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

Commit Craft requires GitHub token access. Use with caution:

- Store tokens securely in Claude Desktop config
- Use tokens with minimal necessary scopes
- Never commit tokens to repository
- Rotate tokens regularly
- Review permissions before granting access

## 🙏 Acknowledgments

- Built with [simple-git](https://github.com/steveukx/git-js) by Steve King
- Built with [@octokit/rest](https://github.com/octokit/rest.js)
- Built with [conventional-commits-parser](https://github.com/conventional-changelog/conventional-changelog)
- Powered by [Model Context Protocol](https://github.com/anthropics/mcp)

---

**Made with ❤️ for developers who love clean git history**
