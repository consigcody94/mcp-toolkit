# 🎫 Ticket Tamer

**AI-powered Jira project management - create issues, search with JQL, manage epics, add comments, and transition workflows**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Jira](https://img.shields.io/badge/Jira-Compatible-0052CC?logo=jira)](https://www.atlassian.com/software/jira)

---

## 🤔 The Project Management Challenge

**"Jira context switching disrupts my development flow"**

Every bug report, status update, or sprint check requires leaving your IDE and navigating through Jira's UI.

- 🖱️ Clicking through issue forms
- 🔍 Writing JQL queries manually
- 📋 Managing workflow transitions
- 💬 Adding comments across issues

**Ticket Tamer brings Jira to your conversation** - create issues, search backlogs, and manage workflows without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎫 **Issue Creation** | Create issues with full field control |
| ✏️ **Issue Updates** | Modify any issue fields |
| 🔍 **JQL Search** | Search issues with Jira Query Language |
| 📦 **Epic Management** | Create epics for organizing work |
| 💬 **Comments** | Add comments to issues |
| 🔄 **Workflow Transitions** | Move issues through workflow states |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Jira Cloud, Server, or Data Center instance
- API token or credentials
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/ticket-tamer.git
cd ticket-tamer
npm install
npm run build
```

### Get Your API Token

**Jira Cloud:**
1. Log in to [Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label and create
4. Copy the token

**Jira Server/Data Center:**
1. Log in to your Jira instance
2. Go to Profile → Personal Access Tokens
3. Create a new token
4. Copy the token

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
    "ticket-tamer": {
      "command": "node",
      "args": ["/absolute/path/to/ticket-tamer/dist/index.js"]
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
"Create a high-priority bug for the login issue"
→ Creates Bug issue with priority High in specified project

"Add a story for implementing OAuth2 authentication"
→ Creates Story with detailed description and acceptance criteria
```

### Search Your Backlog
```
"Find all my in-progress issues"
→ Runs JQL: assignee = currentUser() AND status = "In Progress"

"Show high-priority bugs in the PROJ project"
→ Runs JQL: project = PROJ AND type = Bug AND priority = High
```

### Manage Workflow
```
"Move PROJ-123 to Done"
→ Transitions issue through workflow to Done state

"Add a comment to the deployment issue"
→ Adds comment with deployment notes
```

### Organize with Epics
```
"Create an epic for the authentication overhaul"
→ Creates Epic with name and description for organizing stories
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `create_issue` | Create a new Jira issue |
| `update_issue` | Update an existing issue |
| `search_issues` | Search issues using JQL |
| `create_epic` | Create an Epic issue |
| `add_comment` | Add a comment to an issue |
| `transition_status` | Transition an issue to a different status |

---

## 📊 Tool Details

### create_issue

Create a new Jira issue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectKey` | string | Yes | Project key (e.g., `PROJ`) |
| `summary` | string | Yes | Issue title |
| `description` | string | Yes | Issue description |
| `issueType` | string | Yes | Type: `Bug`, `Task`, `Story`, `Epic` |
| `config` | object | Yes | Jira connection config |

**Config object:**

| Field | Required | Description |
|-------|----------|-------------|
| `host` | Yes | Jira hostname (e.g., `your-domain.atlassian.net`) |
| `username` | Yes | Your email (Cloud) or username (Server) |
| `password` | Yes | API token (Cloud) or password/PAT (Server) |
| `protocol` | No | `https` (default) or `http` |

### update_issue

Update an existing issue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueKey` | string | Yes | Issue key (e.g., `PROJ-123`) |
| `fields` | object | Yes | Fields to update |
| `config` | object | Yes | Jira connection config |

**Common fields:**
- `summary` - Issue title
- `description` - Issue description
- `priority` - `{ "name": "High" }`
- `assignee` - `{ "accountId": "..." }`
- `labels` - `["label1", "label2"]`

### search_issues

Search issues using JQL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jql` | string | Yes | JQL query string |
| `maxResults` | number | No | Max results (default: 50) |
| `config` | object | Yes | Jira connection config |

### create_epic

Create an Epic issue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectKey` | string | Yes | Project key |
| `summary` | string | Yes | Epic title |
| `description` | string | Yes | Epic description |
| `epicName` | string | Yes | Short epic name |
| `config` | object | Yes | Jira connection config |

### add_comment

Add a comment to an issue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueKey` | string | Yes | Issue key |
| `comment` | string | Yes | Comment text |
| `config` | object | Yes | Jira connection config |

### transition_status

Transition an issue to a different status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueKey` | string | Yes | Issue key |
| `transitionName` | string | Yes | Target status name |
| `config` | object | Yes | Jira connection config |

---

## 🔍 JQL Query Reference

### Basic Queries

| Query | Description |
|-------|-------------|
| `project = PROJ` | All issues in project |
| `assignee = currentUser()` | Assigned to you |
| `status = "In Progress"` | In specific status |
| `type = Bug` | Specific issue type |
| `priority = High` | Specific priority |

### Date Queries

| Query | Description |
|-------|-------------|
| `created >= -7d` | Created in last 7 days |
| `updated >= startOfWeek()` | Updated this week |
| `due <= endOfMonth()` | Due this month |

### Combined Queries

| Query | Description |
|-------|-------------|
| `project = PROJ AND status != Done` | Open issues in project |
| `type = Bug AND priority = High` | High-priority bugs |
| `sprint in openSprints()` | Issues in active sprints |

### Ordering

| Query | Description |
|-------|-------------|
| `ORDER BY priority DESC` | Highest priority first |
| `ORDER BY created DESC` | Newest first |

---

## 🎯 Workflow Examples

### Bug Triage

1. **Create the bug:**
   ```
   create_issue with projectKey: "PROJ", summary: "...", issueType: "Bug", ...
   ```

2. **Add details via comment:**
   ```
   add_comment with issueKey: "PROJ-123", comment: "Additional info: ..."
   ```

3. **Assign and start:**
   ```
   update_issue with issueKey: "PROJ-123", fields: {assignee: {...}}
   transition_status with issueKey: "PROJ-123", transitionName: "In Progress"
   ```

### Sprint Planning

1. **Search backlog:**
   ```
   search_issues with jql: "project = PROJ AND sprint is EMPTY ORDER BY priority"
   ```

2. **Create epic for feature:**
   ```
   create_epic with projectKey: "PROJ", summary: "...", epicName: "Q1-Feature"
   ```

### Issue Resolution

1. **Add resolution comment:**
   ```
   add_comment with issueKey: "PROJ-123", comment: "Fixed in commit abc123"
   ```

2. **Close issue:**
   ```
   transition_status with issueKey: "PROJ-123", transitionName: "Done"
   ```

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Never commit credentials | Keep tokens out of version control |
| Full account access | API tokens have full account access |
| Use service accounts | For shared usage |
| Rotate regularly | Change tokens periodically |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Authentication failed" | Verify email (Cloud) or username (Server), check token |
| "Project not found" | Verify project key (case-sensitive), check access |
| "Transition not available" | Check current status, verify transition is allowed |
| "Field not found" | Field names vary by instance |

---

## 📋 Requirements

- Node.js 18 or higher
- Jira Cloud, Server, or Data Center instance
- API token or credentials

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
  <i>Tame your tickets, unleash your productivity.</i>
</p>
