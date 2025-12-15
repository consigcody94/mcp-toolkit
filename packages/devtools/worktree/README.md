# 🌳 worktree-wizard

> Beautiful, intuitive CLI for managing Git worktrees - work on multiple branches simultaneously without the hassle

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

**worktree-wizard** makes Git worktrees accessible and powerful for everyone. Instead of juggling branches with stash/checkout cycles, work on multiple branches simultaneously with an intuitive, beautiful CLI.

## 🎯 Why Git Worktrees?

Git worktrees let you check out multiple branches at once in separate directories. This means you can:

- 🔄 **Switch context instantly** - No more stashing changes
- 🧪 **Test across branches** - Compare implementations side-by-side
- 🐛 **Fix bugs while developing** - Check out main in a separate worktree, fix, push
- ⚡ **Run multiple servers** - Development on one branch, testing on another
- 🔬 **Review PRs locally** - Check out PR branches without disturbing your work

**But native Git worktree commands are clunky.** That's where worktree-wizard comes in.

## ✨ Features

### 🎨 Beautiful Interface
- Colorful, intuitive TUI with status indicators
- Real-time git status for all worktrees
- Clean, organized tables with helpful legends

### 🔍 Fuzzy Search
- Lightning-fast fuzzy finder to switch between worktrees
- Search by branch name or path
- Autocomplete as you type

### 🚀 Smart Commands
- **`wt list`** - See all worktrees with their status at a glance
- **`wt new <branch>`** - Create worktrees with intelligent path management
- **`wt switch`** - Interactive fuzzy search to switch between worktrees
- **`wt remove`** - Safe worktree removal with confirmation
- **`wt clean`** - Find and remove stale worktrees automatically
- **`wt exec <cmd>`** - Run commands across all worktrees in parallel

### 🎯 VS Code Integration
- Open worktrees in new VS Code windows with one command
- Automatic prompt after creating new worktrees
- Terminal integration for quick access

### 🧹 Automatic Cleanup
- Detects stale worktrees (no commits in 90+ days)
- Batch removal with preview
- Dry-run mode to see what would be removed

### 🛡️ Safety First
- Confirmation prompts for destructive operations
- Force flags for override when needed
- Prevents accidental deletion of active work

### 🤖 MCP (Model Context Protocol) Support
- **Use with Claude Desktop and other LLMs!**
- Ask Claude in natural language to manage your worktrees
- 5 powerful tools: list, create, remove, get stale, get info
- Voice control your git workflow
- Context-aware suggestions from Claude

**Example:** "Claude, show me all my worktrees" or "Create a new worktree for the feature/new-ui branch"

[📖 See MCP Setup Guide](MCP_SETUP.md)

## 🚀 Installation

### From Source (until npm published)

```bash
git clone https://github.com/consigcody94/worktree-wizard
cd worktree-wizard
npm install
npm run build
npm link
```

Now you can use `wt` from anywhere!

### MCP Server (for Claude Desktop)

To use worktree-wizard with Claude Desktop:

1. Follow the installation above
2. Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "worktree-wizard": {
         "command": "worktree-wizard-mcp",
         "args": [],
         "cwd": "/path/to/your/git/repo"
       }
     }
   }
   ```
3. Restart Claude Desktop
4. Ask Claude to manage your worktrees!

**See [MCP_SETUP.md](MCP_SETUP.md) for detailed setup and usage examples.**

## 📖 Usage

### List all worktrees

```bash
wt list
# or
wt ls
```

Shows a beautiful table with:
- Status indicators (✓ clean, ● modified, ◆ out of sync, ✗ conflicts)
- Branch names (main branch highlighted)
- Paths (with ~/ shortening)
- Commit hashes
- Detailed git status (ahead/behind, modified files, etc.)

**Example output:**
```
  ✓   main      ~/projects/my-repo         a1b2c3d  clean
  ●   feature-x ~/projects/my-repo-feature a4b5c6d  ~3 +1
  ◆   bugfix    ~/projects/my-repo-bugfix  a7b8c9d  ↑2
```

### Create a new worktree

```bash
# Interactive mode (prompts for branch name)
wt new

# With branch name
wt new feature/awesome-feature

# Custom path
wt new feature-x --path /custom/path

# Force creation even if branch exists
wt new feature-x --force

# Skip VS Code prompt
wt new feature-x --no-open
```

The tool automatically:
- Creates worktree in sensible location (`../repo-name-branch-name`)
- Handles both existing and new branches
- Offers to open in VS Code

### Switch between worktrees

```bash
wt switch

# Open in VS Code
wt switch --vscode

# Open in terminal
wt switch --terminal
```

Uses fuzzy search to quickly find and switch to any worktree. Type to search, arrow keys to navigate, enter to select.

### Remove a worktree

```bash
# Interactive selection
wt remove

# By branch name
wt remove feature-x

# By path
wt remove ../my-repo-feature

# Force remove (even with changes)
wt remove feature-x --force

# Skip confirmation
wt remove feature-x --yes
```

### Clean up stale worktrees

```bash
# Find worktrees with no commits in 90+ days
wt clean

# Custom threshold
wt clean --days 60

# See what would be removed without removing
wt clean --dry

# Remove without confirmation
wt clean --yes
```

### Execute commands across worktrees

```bash
# Run in all non-main worktrees sequentially
wt exec "npm install"

# Run in parallel for speed
wt exec "git pull" --parallel

# Include main worktree
wt exec "npm test" --include-main
```

Perfect for:
- Updating dependencies: `wt exec "npm install"`
- Pulling latest changes: `wt exec "git pull" --parallel`
- Running tests: `wt exec "npm test"`
- Checking status: `wt exec "git status"`

## 🎬 Common Workflows

### Working on a feature while fixing a bug

```bash
# You're working on feature-x
cd ~/projects/my-repo-feature-x

# Urgent bug needs fixing!
wt new hotfix/critical-bug --vscode

# VS Code opens new window
# Fix bug, commit, push

# Switch back to feature work
wt switch
# (fuzzy search for feature-x)
```

### Comparing implementations

```bash
wt new experiment-a
wt new experiment-b

# Open both in VS Code
wt switch --vscode  # select experiment-a
wt switch --vscode  # select experiment-b

# Now you have side-by-side windows to compare!
```

### Reviewing PRs

```bash
# Create worktree for PR branch
wt new pr-123

# Review, test, comment

# Clean up when done
wt remove pr-123
```

### Testing across branches

```bash
# Run tests on all branches in parallel
wt exec "npm test" --parallel

# Update dependencies everywhere
wt exec "npm install" --parallel
```

## 🏗️ Architecture

```
worktree-wizard/
├── src/
│   ├── commands/
│   │   ├── list.ts      # List worktrees with status
│   │   ├── new.ts       # Create worktrees
│   │   ├── remove.ts    # Remove worktrees
│   │   ├── clean.ts     # Clean stale worktrees
│   │   ├── switch.ts    # Fuzzy search switcher
│   │   └── exec.ts      # Execute across worktrees
│   ├── managers/
│   │   └── worktree-manager.ts  # Core worktree operations
│   ├── utils/
│   │   ├── format.ts    # Formatting utilities
│   │   └── vscode.ts    # VS Code integration
│   ├── types.ts         # TypeScript interfaces
│   ├── cli.ts           # CLI interface
│   └── index.ts         # Public API
├── tests/               # Test suite
└── dist/                # Compiled output
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- list

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💡 Tips & Tricks

### Naming Convention

The tool automatically generates paths as `../repo-name-branch-name`. This keeps worktrees organized and easy to find.

### VS Code Workspaces

Each worktree can have its own VS Code workspace with different settings, extensions enabled/disabled, etc.

### Git Configuration

Worktrees share the same git configuration and remotes, but have independent:
- Working directories
- Index (staging area)
- HEAD (current branch)

### Disk Space

Worktrees share the same .git directory (objects, refs), so they're much more efficient than full clones. Only the working directory is duplicated.

### Performance

Use `--parallel` flag with `wt exec` for operations that don't conflict (like `git pull` or `npm install`).

## ❓ FAQ

**Q: How is this different from git worktree add?**
A: worktree-wizard wraps git worktree with a beautiful interface, smart path management, fuzzy search, VS Code integration, and quality-of-life features like stale worktree detection.

**Q: Can I use this with existing worktrees?**
A: Yes! The tool works with any worktrees, whether created with `git worktree add` or `wt new`.

**Q: What if I have conflicts in a worktree?**
A: The status indicator shows ✗ for conflicts, and you can see details with `wt list --verbose`.

**Q: Can I move worktrees?**
A: Don't move them manually. Remove and recreate instead: `wt remove old-path && wt new branch-name --path new-path`

**Q: Does this work on Windows?**
A: Yes! The tool works on Linux, macOS, and Windows.

## 📄 License

MIT © [consigcody94](https://github.com/consigcody94)

## 🙏 Acknowledgments

- Built with [simple-git](https://github.com/steveukx/git-js)
- Powered by [Commander.js](https://github.com/tj/commander.js)
- Beautiful UI with [chalk](https://github.com/chalk/chalk), [ora](https://github.com/sindresorhus/ora), and [inquirer](https://github.com/SBoudrias/Inquirer.js)
- Fuzzy search with [fuzzy](https://github.com/mattyork/fuzzy)

## 🤖 MCP Integration

worktree-wizard can be used as an MCP server with Claude Desktop and other LLM applications!

**What you can do:**
- Ask Claude to list your worktrees
- Have Claude create worktrees for you
- Get Claude's help cleaning up stale worktrees
- Natural language git workflow management

**Setup:** See [MCP_SETUP.md](MCP_SETUP.md) for detailed configuration

**Example conversation:**
```
You: "Claude, I need to work on a new feature while keeping my current work"
Claude: "I'll create a new worktree for you. What's the branch name?"
You: "feature/awesome-feature"
Claude: *uses create_worktree tool* "Created worktree at ../repo-feature-awesome-feature"
```

## 🔗 Links

- [GitHub Repository](https://github.com/consigcody94/worktree-wizard)
- [Issue Tracker](https://github.com/consigcody94/worktree-wizard/issues)
- [MCP Setup Guide](MCP_SETUP.md)
- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

Made with ❤️ by [consigcody94](https://github.com/consigcody94)

**Star this repo if you find it useful!** ⭐
