# MCP (Model Context Protocol) Setup

worktree-wizard now supports MCP, allowing you to use it directly from Claude Desktop and other LLM applications!

## What is MCP?

MCP (Model Context Protocol) lets LLMs like Claude use tools directly. With worktree-wizard's MCP server, Claude can:
- List your git worktrees
- Create new worktrees for branches
- Remove worktrees when done
- Find stale worktrees to clean up
- Get detailed worktree status

## Installation

1. **Install worktree-wizard globally:**
   ```bash
   cd worktree-wizard
   npm install
   npm run build
   npm link
   ```

2. **Configure MCP in Claude Desktop**

   On macOS, edit:
   ```bash
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

   On Linux:
   ```bash
   ~/.config/Claude/claude_desktop_config.json
   ```

   On Windows:
   ```bash
   %APPDATA%\Claude\claude_desktop_config.json
   ```

3. **Add worktree-wizard to your MCP servers:**
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

   **Important:** Replace `/path/to/your/git/repo` with the actual path to your git repository!

4. **Restart Claude Desktop**

## Usage Examples

Once configured, you can ask Claude:

### List Worktrees
> "Show me all my git worktrees"

Claude will use the `list_worktrees` tool to display all your worktrees with their status.

### Create a Worktree
> "Create a new worktree for the feature/new-ui branch"

Claude will use the `create_worktree` tool to create a worktree at an auto-generated path.

### Remove a Worktree
> "Remove the worktree for the old-feature branch"

Claude will use the `remove_worktree` tool to safely remove the worktree.

### Find Stale Worktrees
> "Show me worktrees I haven't touched in 3 months"

Claude will use the `get_stale_worktrees` tool to find inactive worktrees.

### Get Worktree Info
> "What's the status of my feature-x worktree?"

Claude will use the `worktree_info` tool to show detailed information.

## Available MCP Tools

### `list_worktrees`
Lists all git worktrees with their status, branches, and paths.

**No parameters required**

### `create_worktree`
Creates a new git worktree for a branch.

**Parameters:**
- `branch` (required): Branch name (e.g., "feature/new-feature")
- `path` (optional): Custom path for worktree
- `force` (optional): Force creation even if branch has a worktree

### `remove_worktree`
Removes a git worktree by branch name or path.

**Parameters:**
- `identifier` (required): Branch name or path
- `force` (optional): Force removal even with uncommitted changes

### `get_stale_worktrees`
Finds worktrees with no commits for specified days.

**Parameters:**
- `days` (optional, default: 90): Days threshold for stale worktrees

### `worktree_info`
Gets detailed information about a specific worktree.

**Parameters:**
- `branch` (required): Branch name to get info for

## Multiple Repositories

You can configure multiple repositories by adding multiple MCP server entries:

```json
{
  "mcpServers": {
    "worktree-wizard-project1": {
      "command": "worktree-wizard-mcp",
      "args": [],
      "cwd": "/path/to/project1"
    },
    "worktree-wizard-project2": {
      "command": "worktree-wizard-mcp",
      "args": [],
      "cwd": "/path/to/project2"
    }
  }
}
```

## Troubleshooting

### "Command not found: worktree-wizard-mcp"

Make sure you ran `npm link` after building. You can also use the full path:

```json
{
  "command": "node",
  "args": ["/full/path/to/worktree-wizard/dist/mcp-server.js"],
  "cwd": "/path/to/your/repo"
}
```

### "Not a git repository"

Make sure the `cwd` in your MCP configuration points to a valid git repository.

### Claude doesn't see the tools

1. Restart Claude Desktop completely
2. Check that your config file is valid JSON
3. Check Claude Desktop logs for errors

## Benefits of MCP Integration

- **Voice Control**: Ask Claude in natural language to manage worktrees
- **Context Aware**: Claude can see your worktree status and make smart suggestions
- **Automation**: Chain multiple operations together naturally
- **Learning**: Claude can explain git worktree concepts as you use them
- **Safety**: Claude will confirm destructive operations before executing

## Example Conversations

**"I need to fix a bug in production while working on this feature"**
Claude: "I'll create a new worktree for a hotfix branch..."
*Uses create_worktree tool*

**"Clean up my workspace, I have too many old worktrees"**
Claude: "Let me find your stale worktrees..."
*Uses get_stale_worktrees, then suggests removing specific ones*

**"What branches am I working on right now?"**
Claude: "Here are all your active worktrees..."
*Uses list_worktrees to show everything*

---

For more information about MCP, visit: https://modelcontextprotocol.io
