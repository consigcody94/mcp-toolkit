# 📋 Linear Flow

**AI-powered Linear project management - create issues, manage projects, track cycles, and automate your workflow**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Linear](https://img.shields.io/badge/Linear-Compatible-5E6AD2?logo=linear)](https://linear.app/)

---

## 🤔 The Project Management Challenge

**"Context switching to Linear breaks my flow"**

Every time you need to create an issue, update a status, or check sprint progress, you're switching contexts and losing momentum.

- 🖱️ Clicking through UI forms
- 🔍 Searching for team and state IDs
- 📊 Checking cycle progress manually
- 🏷️ Managing labels across projects

**Linear Flow keeps you in the zone** - manage your entire Linear workflow through natural language without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎫 **Issue Management** | Create and update issues with full field control |
| 👥 **Team Information** | Retrieve team details and workflow states |
| 🔄 **Cycle Tracking** | Get active cycle progress and metrics |
| 📁 **Project Creation** | Create projects with team associations |
| 🏷️ **Label Management** | Create custom labels with colors |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Linear account with API key
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/linear-flow.git
cd linear-flow
npm install
npm run build
```

### Get Your API Key

1. Go to [Linear Settings](https://linear.app/settings/api)
2. Click "Create key" under "Personal API keys"
3. Give it a label (e.g., "MCP Server")
4. Copy the generated key (starts with `lin_api_`)

### Configure Claude Desktop

Add to your config file:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "linear-flow": {
      "command": "node",
      "args": ["/absolute/path/to/linear-flow/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "lin_api_your_key_here"
      }
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Create Issues
```
"Create a high-priority bug for the authentication team"
→ Creates issue with priority 2 (High) assigned to ENG team

"Add a feature request for implementing OAuth2 with detailed requirements"
→ Creates issue with markdown description and proper labeling
```

### Track Progress
```
"What's in the current sprint?"
→ Returns cycle info with issue count, completion %, and dates

"Show me the ENG team's workflow states"
→ Lists all states with IDs for transitions
```

### Manage Workflow
```
"Move FEAT-123 to In Progress"
→ Updates issue state to in_progress

"Create a new project for Q1 platform improvements"
→ Creates project linked to specified teams
```

### Organize with Labels
```
"Create a tech-debt label with red color for the ENG team"
→ Creates label with hex color #FF6B6B

"Add the urgent label to the login bug"
→ Updates issue with new label
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `create_issue` | Create a new issue in Linear |
| `update_issue` | Update an existing issue |
| `get_team` | Get team information including workflow states |
| `get_cycle` | Get cycle (sprint) information |
| `create_project` | Create a new project |
| `add_label` | Create a new label for a team |

---

## 📊 Tool Details

### create_issue

Create a new issue in Linear.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Issue title |
| `teamId` | string | Yes | Team ID or key (e.g., "ENG") |
| `description` | string | No | Issue description (markdown) |
| `priority` | number | No | 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low |
| `assigneeId` | string | No | User ID to assign |
| `labelIds` | string[] | No | Array of label IDs |

### update_issue

Update an existing issue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueId` | string | Yes | Issue ID to update |
| `title` | string | No | New title |
| `description` | string | No | New description |
| `priority` | number | No | New priority |
| `stateId` | string | No | New state ID |
| `assigneeId` | string | No | New assignee ID |

### get_team

Get team information including workflow states.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `teamId` | string | Yes | Team ID or key (e.g., "ENG") |

**Response includes:**
- Team ID, key, and name
- Workflow states with IDs, names, types, and colors

### get_cycle

Get cycle (sprint) information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `teamId` | string | Yes | Team ID |
| `cycleId` | string | No | Specific cycle (default: active) |

**Response includes:**
- Cycle ID and number
- Start and end dates
- Issue count and completed count
- Progress percentage

### create_project

Create a new project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Project name |
| `teamIds` | string[] | Yes | Associated team IDs |
| `description` | string | No | Project description |
| `targetDate` | string | No | Target date (ISO 8601) |
| `state` | string | No | planned, started, paused, completed, canceled |

### add_label

Create a new label for a team.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Label name |
| `teamId` | string | Yes | Team ID |
| `color` | string | No | Hex color (e.g., "#FF6B6B") |
| `description` | string | No | Label description |

---

## 🔑 Finding IDs

| ID Type | How to Find |
|---------|-------------|
| Team ID | Use team key directly (e.g., "ENG") or find in URL: `linear.app/team/TEAM_KEY` |
| State IDs | Use `get_team` to list all states with their IDs |
| User IDs | Find in Linear settings or API |
| Label IDs | Created labels return their ID |

---

## 🎯 Workflow Examples

### Bug Triage Workflow

1. **Create the bug:**
   ```
   create_issue with title: "Login fails on Safari", teamId: "ENG", priority: 2
   ```

2. **Get team states:**
   ```
   get_team with teamId: "ENG"
   ```

3. **Update to triage state:**
   ```
   update_issue with issueId: "...", stateId: "state_triage"
   ```

### Sprint Planning

1. **Check current cycle:**
   ```
   get_cycle with teamId: "ENG"
   ```

2. **Create sprint issues:**
   ```
   create_issue with title: "...", teamId: "ENG", ...
   ```

3. **Create organizing project:**
   ```
   create_project with name: "Sprint 5 Goals", teamIds: ["ENG"]
   ```

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Never commit keys | Keep API keys out of version control |
| Full access | API keys have full workspace access |
| Rotate regularly | Change keys periodically |
| Separate keys | Use different keys for different apps |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "LINEAR_API_KEY required" | Set the API key in Claude Desktop config |
| "Team not found" | Verify team key/ID and API key permissions |
| Issue creation fails | Check teamId is valid, required fields provided |
| State transition fails | Get valid state IDs with `get_team` |

---

## 📋 Requirements

- Node.js 18 or higher
- Linear API key
- Active Linear workspace

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👤 Author

**consigcody94**

---

<p align="center">
  <i>Stay in flow while managing your workflow.</i>
</p>
