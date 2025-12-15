<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,3,12&height=200&section=header&text=🧰%20MCP%20TOOLKIT&fontSize=70&fontColor=fff&animation=twinkling&fontAlignY=35&desc=The%20Ultimate%20Model%20Context%20Protocol%20Collection&descAlignY=55&descSize=18"/>

<br/>

<!-- Badges Row 1 -->
<p>
<a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Protocol-00d4aa?style=for-the-badge" alt="MCP Protocol"/></a>
<a href="#"><img src="https://img.shields.io/badge/Packages-31-blue?style=for-the-badge" alt="31 Packages"/></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/></a>
<a href="#"><img src="https://img.shields.io/badge/Claude_Desktop-Ready-blueviolet?style=for-the-badge&logo=anthropic" alt="Claude Desktop"/></a>
</p>

<!-- Badges Row 2 -->
<p>
<img src="https://img.shields.io/badge/TypeScript-✓-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
<img src="https://img.shields.io/badge/pnpm-Workspaces-f69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm"/>
<img src="https://img.shields.io/badge/Monorepo-✓-ff6b6b?style=flat-square" alt="Monorepo"/>
</p>

<br/>

<!-- Tagline Box -->
<table>
<tr>
<td>

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🧰  MCP Toolkit brings together 31 Model Context Protocol servers          ║
║       in one unified monorepo — giving Claude Desktop superpowers            ║
║       across productivity, development, security, and more.                  ║
║                                                                              ║
║       ✨ One Install: All 31 MCP servers ready to use                        ║
║       ✨ Organized: 6 categories for easy discovery                          ║
║       ✨ Maintained: Single source of truth for updates                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

</td>
</tr>
</table>

<br/>

<!-- Quick Links -->
[**🚀 Quick Start**](#-quick-start) · [**📊 Productivity**](#-productivity-9-packages) · [**🛠️ DevTools**](#%EF%B8%8F-devtools-8-packages) · [**🔒 Security**](#-security-4-packages) · [**🧠 Context**](#-context--data-6-packages) · [**🎮 Media**](#-media--gaming-5-packages) · [**🔧 Utility**](#-utility-4-packages)

<br/>

</div>

---

<br/>

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/mcp-toolkit.git
cd mcp-toolkit

# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

### Claude Desktop Configuration

Add servers to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sheets": {
      "command": "node",
      "args": ["/path/to/mcp-toolkit/packages/productivity/sheets/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-secret"
      }
    }
  }
}
```

<br/>

---

<br/>

## 📊 Productivity (9 packages)

### 📗 Sheets Wizard

**Google Sheets automation with natural language**

| Feature | Description |
|:--------|:------------|
| **Read/Write** | Access any spreadsheet with natural language |
| **Formulas** | Generate complex formulas from descriptions |
| **Charts** | Create and customize charts |
| **Formatting** | Apply conditional formatting rules |
| **Pivot Tables** | Generate pivot tables from data |

**Tools:**
- `sheets_read` - Read data from a spreadsheet range
- `sheets_write` - Write data to a spreadsheet
- `sheets_create` - Create a new spreadsheet
- `sheets_format` - Apply formatting to cells
- `sheets_chart` - Create charts from data
- `sheets_formula` - Generate formulas from natural language

**Config:**
```json
{
  "env": {
    "GOOGLE_CLIENT_ID": "required",
    "GOOGLE_CLIENT_SECRET": "required",
    "GOOGLE_REFRESH_TOKEN": "required"
  }
}
```

---

### 🎫 Ticket Tamer (Jira)

**Jira project management automation**

| Feature | Description |
|:--------|:------------|
| **Issue Management** | Create, update, search, and transition issues |
| **Sprint Planning** | Manage sprints and backlogs |
| **Bulk Operations** | Mass update tickets |
| **JQL Queries** | Natural language to JQL conversion |
| **Reports** | Generate sprint reports and velocity charts |

**Tools:**
- `jira_create_issue` - Create a new issue with full field support
- `jira_update_issue` - Update existing issues
- `jira_search` - Search with JQL or natural language
- `jira_transition` - Move issues through workflows
- `jira_get_sprint` - Get sprint information
- `jira_bulk_update` - Update multiple issues at once
- `jira_add_comment` - Add comments to issues

**Config:**
```json
{
  "env": {
    "JIRA_HOST": "your-domain.atlassian.net",
    "JIRA_EMAIL": "your-email",
    "JIRA_API_TOKEN": "your-api-token"
  }
}
```

---

### 💬 Slack Sage

**Slack workspace communication and automation**

| Feature | Description |
|:--------|:------------|
| **Messaging** | Send messages, replies, and reactions |
| **Channel Management** | Create, archive, and manage channels |
| **Search** | Search messages across workspaces |
| **User Lookup** | Find users and their information |
| **Workflows** | Trigger and manage Slack workflows |

**Tools:**
- `slack_send_message` - Send messages to channels or users
- `slack_reply_thread` - Reply to message threads
- `slack_search` - Search messages with filters
- `slack_get_channel_history` - Get recent channel messages
- `slack_create_channel` - Create new channels
- `slack_list_users` - List workspace members
- `slack_upload_file` - Upload files to channels

**Config:**
```json
{
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-your-token",
    "SLACK_SIGNING_SECRET": "your-signing-secret"
  }
}
```

---

### 🎨 Design Wand (Figma)

**Figma design workflow automation**

| Feature | Description |
|:--------|:------------|
| **File Access** | Read and navigate Figma files |
| **Component Info** | Extract component properties |
| **Export** | Export assets in various formats |
| **Comments** | Read and add comments |
| **Variables** | Access design tokens and variables |

**Tools:**
- `figma_get_file` - Get file structure and metadata
- `figma_get_components` - List all components in a file
- `figma_get_styles` - Extract color, text, and effect styles
- `figma_export_asset` - Export nodes as PNG, SVG, PDF
- `figma_get_comments` - Read file comments
- `figma_post_comment` - Add comments to files
- `figma_get_variables` - Access design variables/tokens

**Config:**
```json
{
  "env": {
    "FIGMA_ACCESS_TOKEN": "your-personal-access-token"
  }
}
```

---

### 📋 Linear Flow

**Linear project management integration**

| Feature | Description |
|:--------|:------------|
| **Issues** | Create and manage issues with full metadata |
| **Projects** | Organize work into projects |
| **Cycles** | Plan and track cycles (sprints) |
| **Labels** | Organize with labels and priorities |
| **Roadmaps** | Access and update roadmap items |

**Tools:**
- `linear_create_issue` - Create issues with assignee, labels, project
- `linear_update_issue` - Update issue properties
- `linear_search_issues` - Search with filters
- `linear_get_project` - Get project details
- `linear_list_cycles` - List active and past cycles
- `linear_assign_issue` - Assign issues to team members

**Config:**
```json
{
  "env": {
    "LINEAR_API_KEY": "lin_api_xxxxx"
  }
}
```

---

### 🗃️ Vault Weaver (Obsidian)

**Obsidian knowledge base integration**

| Feature | Description |
|:--------|:------------|
| **Note Access** | Read, create, and update notes |
| **Search** | Full-text and tag-based search |
| **Backlinks** | Traverse note connections |
| **Templates** | Apply note templates |
| **Dataview** | Query notes with Dataview syntax |

**Tools:**
- `obsidian_read_note` - Read note content and metadata
- `obsidian_create_note` - Create new notes with templates
- `obsidian_update_note` - Update existing notes
- `obsidian_search` - Search notes by content or tags
- `obsidian_get_backlinks` - Find notes linking to a note
- `obsidian_list_tags` - List all tags in vault
- `obsidian_run_dataview` - Execute Dataview queries

**Config:**
```json
{
  "env": {
    "OBSIDIAN_VAULT_PATH": "/path/to/your/vault",
    "OBSIDIAN_REST_API_KEY": "optional-for-rest-api"
  }
}
```

---

### 📝 Notion Weaver

**Notion workspace automation**

| Feature | Description |
|:--------|:------------|
| **Pages** | Create, read, update pages |
| **Databases** | Query and update databases |
| **Blocks** | Manipulate page content blocks |
| **Search** | Full-text search across workspace |
| **Sync** | Sync data between Notion and external sources |

**Tools:**
- `notion_get_page` - Get page content and properties
- `notion_create_page` - Create new pages
- `notion_update_page` - Update page properties
- `notion_query_database` - Query databases with filters
- `notion_create_database_item` - Add items to databases
- `notion_search` - Search across workspace
- `notion_append_blocks` - Add content to pages

**Config:**
```json
{
  "env": {
    "NOTION_API_KEY": "secret_xxxxx"
  }
}
```

---

### 📎 Office Whisperer

**Microsoft Office 365 suite integration**

| Feature | Description |
|:--------|:------------|
| **Excel** | Read/write spreadsheets, create charts |
| **Word** | Document creation and editing |
| **PowerPoint** | Presentation management |
| **Outlook** | Email and calendar access |
| **OneDrive** | File storage operations |

**Tools:**
- `office_excel_read` - Read Excel workbooks
- `office_excel_write` - Write to Excel files
- `office_word_create` - Create Word documents
- `office_outlook_send` - Send emails
- `office_outlook_calendar` - Manage calendar events
- `office_onedrive_list` - List OneDrive files
- `office_onedrive_download` - Download files

**Config:**
```json
{
  "env": {
    "MICROSOFT_CLIENT_ID": "your-app-client-id",
    "MICROSOFT_CLIENT_SECRET": "your-secret",
    "MICROSOFT_TENANT_ID": "your-tenant-id"
  }
}
```

---

### 🎯 ServiceNow Dashboard Generator

**ServiceNow dashboard and reporting automation**

| Feature | Description |
|:--------|:------------|
| **Incidents** | Create and manage incidents |
| **Dashboards** | Generate custom dashboards |
| **Reports** | Create and schedule reports |
| **CMDB** | Query configuration items |
| **Workflows** | Trigger and monitor workflows |

**Tools:**
- `servicenow_create_incident` - Create incidents
- `servicenow_query_table` - Query any table
- `servicenow_update_record` - Update records
- `servicenow_create_dashboard` - Generate dashboards
- `servicenow_get_cmdb` - Query CMDB items
- `servicenow_run_report` - Generate reports

**Config:**
```json
{
  "env": {
    "SERVICENOW_INSTANCE": "your-instance.service-now.com",
    "SERVICENOW_USER": "username",
    "SERVICENOW_PASSWORD": "password"
  }
}
```

<br/>

---

<br/>

## 🛠️ DevTools (8 packages)

### 🗄️ SQL Whisperer

**Natural language to SQL with query execution**

| Feature | Description |
|:--------|:------------|
| **Query Generation** | Convert natural language to SQL |
| **Multi-Database** | PostgreSQL, MySQL, SQLite, MSSQL |
| **Schema Analysis** | Understand your database structure |
| **Query Execution** | Run queries safely with previews |
| **Optimization** | Get query optimization suggestions |

**Tools:**
- `sql_query` - Execute SQL queries
- `sql_natural_language` - Convert natural language to SQL
- `sql_schema` - Get database schema information
- `sql_tables` - List all tables
- `sql_explain` - Explain query execution plan
- `sql_optimize` - Get optimization suggestions

**Config:**
```json
{
  "env": {
    "DATABASE_URL": "postgresql://user:pass@host:5432/db"
  }
}
```

---

### 📝 Commit Craft

**Git workflow automation with smart commits**

| Feature | Description |
|:--------|:------------|
| **Smart Commits** | Generate meaningful commit messages |
| **Branch Management** | Create, switch, merge branches |
| **History Analysis** | Analyze commit history |
| **Diff Explanation** | Explain code changes |
| **PR Descriptions** | Auto-generate PR descriptions |

**Tools:**
- `git_status` - Get repository status
- `git_diff` - Show changes with explanations
- `git_commit` - Create commits with smart messages
- `git_branch` - Branch operations
- `git_log` - Analyze commit history
- `git_pr_description` - Generate PR descriptions

**Config:**
```json
{
  "env": {
    "GIT_AUTHOR_NAME": "Your Name",
    "GIT_AUTHOR_EMAIL": "you@email.com"
  }
}
```

---

### 🏥 Repo Doctor

**Repository health analysis and fixes**

| Feature | Description |
|:--------|:------------|
| **Health Checks** | Comprehensive repo health analysis |
| **Dependency Audit** | Check for outdated/vulnerable deps |
| **Code Quality** | Lint and format analysis |
| **CI/CD Analysis** | Pipeline configuration review |
| **Auto-Fix** | Automatically fix common issues |

**Tools:**
- `repo_health_check` - Full repository health scan
- `repo_dependency_audit` - Check dependencies
- `repo_lint_check` - Run linters
- `repo_security_scan` - Security vulnerability scan
- `repo_fix_issues` - Auto-fix detected issues
- `repo_generate_config` - Generate missing configs

---

### 🌳 Worktree Wizard

**Git worktree management for parallel development**

| Feature | Description |
|:--------|:------------|
| **Worktree Creation** | Create worktrees from branches |
| **Management** | List, prune, and manage worktrees |
| **Branch Tracking** | Track worktree branch relationships |
| **Cleanup** | Automatic stale worktree cleanup |

**Tools:**
- `worktree_create` - Create a new worktree
- `worktree_list` - List all worktrees
- `worktree_remove` - Remove a worktree
- `worktree_prune` - Clean up stale worktrees
- `worktree_move` - Move worktree location

---

### 🔌 API Pilot

**API exploration, testing, and mocking**

| Feature | Description |
|:--------|:------------|
| **Discovery** | Explore APIs from OpenAPI specs |
| **Testing** | Test endpoints with assertions |
| **Mocking** | Create mock servers |
| **Documentation** | Generate API documentation |
| **Collections** | Manage request collections |

**Tools:**
- `api_request` - Make HTTP requests
- `api_import_openapi` - Import OpenAPI specifications
- `api_create_mock` - Create mock endpoints
- `api_test_endpoint` - Test with assertions
- `api_generate_docs` - Generate documentation

**Config:**
```json
{
  "env": {
    "API_BASE_URL": "https://api.example.com",
    "API_AUTH_TOKEN": "optional-default-token"
  }
}
```

---

### 💎 TS Pilot

**TypeScript development assistance**

| Feature | Description |
|:--------|:------------|
| **Type Generation** | Generate types from data |
| **Refactoring** | Automated code refactoring |
| **Error Fixes** | Fix TypeScript errors |
| **Migration** | JS to TS migration assistance |
| **Documentation** | Generate TSDoc comments |

**Tools:**
- `ts_check_errors` - Find TypeScript errors
- `ts_generate_types` - Generate types from data/JSON
- `ts_refactor` - Refactor code patterns
- `ts_migrate_file` - Migrate JS to TS
- `ts_generate_docs` - Generate documentation

---

### 🐳 Infra Pilot (Docker & K8s)

**Docker and Kubernetes management**

| Feature | Description |
|:--------|:------------|
| **Docker** | Build, run, manage containers |
| **Compose** | Docker Compose operations |
| **Kubernetes** | kubectl operations via Claude |
| **Helm** | Helm chart management |
| **Logs** | Container log analysis |

**Tools:**
- `docker_build` - Build Docker images
- `docker_run` - Run containers
- `docker_compose` - Manage compose stacks
- `k8s_apply` - Apply Kubernetes manifests
- `k8s_get` - Get Kubernetes resources
- `k8s_logs` - Get pod logs
- `helm_install` - Install Helm charts

**Config:**
```json
{
  "env": {
    "KUBECONFIG": "/path/to/.kube/config",
    "DOCKER_HOST": "unix:///var/run/docker.sock"
  }
}
```

---

### 🏗️ Infra Sage (Terraform)

**Terraform infrastructure management**

| Feature | Description |
|:--------|:------------|
| **Plan/Apply** | Execute Terraform workflows |
| **State Management** | Inspect and manage state |
| **Module Generation** | Generate Terraform modules |
| **Drift Detection** | Detect infrastructure drift |
| **Cost Estimation** | Estimate infrastructure costs |

**Tools:**
- `terraform_init` - Initialize Terraform
- `terraform_plan` - Generate execution plan
- `terraform_apply` - Apply changes
- `terraform_state` - Inspect state
- `terraform_generate` - Generate configurations
- `terraform_cost` - Estimate costs

**Config:**
```json
{
  "env": {
    "AWS_ACCESS_KEY_ID": "optional",
    "AWS_SECRET_ACCESS_KEY": "optional",
    "TF_VAR_file": "/path/to/terraform.tfvars"
  }
}
```

<br/>

---

<br/>

## 🔒 Security (4 packages)

### 🛡️ Sentinel AI

**AI-powered code security scanning**

| Feature | Description |
|:--------|:------------|
| **Vulnerability Scan** | Detect security vulnerabilities |
| **OWASP Top 10** | Check for common vulnerabilities |
| **Secret Detection** | Find exposed secrets/credentials |
| **Dependency Audit** | Check for vulnerable dependencies |
| **Fix Suggestions** | AI-powered remediation advice |

**Tools:**
- `sentinel_scan` - Full security scan
- `sentinel_secrets` - Scan for exposed secrets
- `sentinel_dependencies` - Audit dependencies
- `sentinel_owasp` - OWASP Top 10 check
- `sentinel_fix` - Get fix suggestions

---

### 🔐 Code Guardian

**Security validation for AI-generated code**

| Feature | Description |
|:--------|:------------|
| **AI Code Audit** | Validate AI-generated code |
| **Injection Detection** | SQL, XSS, command injection |
| **Auth Analysis** | Authentication/authorization review |
| **Input Validation** | Check input sanitization |
| **Compliance** | Check against security standards |

**Tools:**
- `guardian_audit` - Audit code for security issues
- `guardian_injection` - Check for injection vulnerabilities
- `guardian_auth` - Review authentication logic
- `guardian_validate_input` - Check input validation
- `guardian_compliance` - Compliance checking

---

### ⚔️ Metasploit MCP

**Metasploit Framework integration for authorized pentesting**

| Feature | Description |
|:--------|:------------|
| **Module Search** | Search Metasploit modules |
| **Exploit Info** | Get exploit details and usage |
| **Workspace** | Manage pentesting workspaces |
| **Scan Results** | Import and analyze scan results |
| **Report Generation** | Generate pentest reports |

**Tools:**
- `msf_search` - Search modules
- `msf_info` - Get module information
- `msf_workspace` - Manage workspaces
- `msf_hosts` - List discovered hosts
- `msf_vulns` - List vulnerabilities
- `msf_report` - Generate reports

**Config:**
```json
{
  "env": {
    "MSF_HOST": "localhost",
    "MSF_PORT": "55553",
    "MSF_PASSWORD": "your-msfrpcd-password"
  }
}
```

> ⚠️ **For authorized security testing only**

---

### 🔍 Detective Claude (Steganography)

**Steganography detection and analysis**

| Feature | Description |
|:--------|:------------|
| **Detection** | Detect hidden data in files |
| **Analysis** | Analyze steganographic techniques |
| **Extraction** | Extract hidden messages |
| **File Types** | Support for images, audio, video |
| **Forensics** | Digital forensics assistance |

**Tools:**
- `stego_detect` - Detect hidden data
- `stego_analyze` - Analyze file for techniques used
- `stego_extract` - Extract hidden content
- `stego_metadata` - Analyze file metadata

<br/>

---

<br/>

## 🧠 Context & Data (6 packages)

### 🎯 Context Pilot

**Living project context management**

| Feature | Description |
|:--------|:------------|
| **Auto-Context** | Automatically track project context |
| **Memory** | Remember decisions and discussions |
| **Relevance** | Surface relevant context automatically |
| **Export** | Export context for documentation |

**Tools:**
- `context_add` - Add context information
- `context_query` - Query relevant context
- `context_summarize` - Summarize project context
- `context_export` - Export context to markdown

---

### 🧠 Code Memory

**Persistent codebase context vault**

| Feature | Description |
|:--------|:------------|
| **Architecture** | Remember codebase architecture |
| **Patterns** | Track coding patterns and conventions |
| **History** | Remember past discussions and decisions |
| **Search** | Semantic search through memories |

**Tools:**
- `memory_store` - Store information
- `memory_recall` - Recall relevant memories
- `memory_search` - Search memories
- `memory_forget` - Remove outdated info

---

### 📈 Dev Mirror (Productivity Tracker)

**Developer productivity analytics**

| Feature | Description |
|:--------|:------------|
| **Time Tracking** | Track time on tasks |
| **Metrics** | Lines, commits, PRs metrics |
| **Patterns** | Identify productivity patterns |
| **Reports** | Generate productivity reports |

**Tools:**
- `tracker_start` - Start tracking a task
- `tracker_stop` - Stop tracking
- `tracker_report` - Generate reports
- `tracker_metrics` - Get productivity metrics

---

### 🔄 Data Transform

**Universal data transformation**

| Feature | Description |
|:--------|:------------|
| **Format Conversion** | JSON, YAML, XML, CSV, etc. |
| **Schema Mapping** | Map between different schemas |
| **Validation** | Validate data against schemas |
| **Transformation** | Complex data transformations |

**Tools:**
- `transform_convert` - Convert between formats
- `transform_map` - Map schema fields
- `transform_validate` - Validate against schema
- `transform_query` - Query data with JSONPath/JQ

---

### 📰 News Radar

**News aggregation and analysis**

| Feature | Description |
|:--------|:------------|
| **Aggregation** | Aggregate from multiple sources |
| **Summarization** | AI-powered summaries |
| **Sentiment** | Sentiment analysis |
| **Trends** | Identify trending topics |

**Tools:**
- `news_search` - Search news articles
- `news_summarize` - Summarize articles
- `news_sentiment` - Analyze sentiment
- `news_trends` - Get trending topics

**Config:**
```json
{
  "env": {
    "NEWS_API_KEY": "your-newsapi-key"
  }
}
```

---

### 🚀 Cosmic Atlas (Space Data)

**Space and astronomy data platform**

| Feature | Description |
|:--------|:------------|
| **NASA APIs** | Access NASA open data |
| **Satellite Tracking** | Track satellites and ISS |
| **Astronomy** | Star charts and celestial data |
| **Mars Weather** | Mars weather data |

**Tools:**
- `space_apod` - NASA Astronomy Picture of the Day
- `space_mars_weather` - Mars weather data
- `space_neo` - Near Earth Objects
- `space_iss` - ISS location tracking
- `space_satellites` - Satellite tracking

**Config:**
```json
{
  "env": {
    "NASA_API_KEY": "your-nasa-api-key"
  }
}
```

<br/>

---

<br/>

## 🎮 Media & Gaming (5 packages)

### 📺 Stream Pilot

**OBS Studio and Twitch streaming control**

| Feature | Description |
|:--------|:------------|
| **OBS Control** | Scene switching, source management |
| **Twitch** | Chat, clips, markers |
| **Overlays** | Dynamic overlay updates |
| **Alerts** | Custom alert triggers |

**Tools:**
- `obs_scene` - Switch OBS scenes
- `obs_source` - Manage sources
- `obs_recording` - Start/stop recording
- `twitch_chat` - Send chat messages
- `twitch_clip` - Create clips
- `twitch_marker` - Add stream markers

**Config:**
```json
{
  "env": {
    "OBS_WEBSOCKET_URL": "ws://localhost:4455",
    "OBS_WEBSOCKET_PASSWORD": "your-password",
    "TWITCH_ACCESS_TOKEN": "your-token"
  }
}
```

---

### 🎵 Studio Pilot (Ableton Live)

**Ableton Live DAW control**

| Feature | Description |
|:--------|:------------|
| **Transport** | Play, stop, record control |
| **Tracks** | Track manipulation |
| **Clips** | Clip launching and looping |
| **Devices** | Device parameter control |

**Tools:**
- `ableton_play` - Start playback
- `ableton_stop` - Stop playback
- `ableton_record` - Toggle recording
- `ableton_track` - Track operations
- `ableton_clip` - Clip operations
- `ableton_tempo` - Set tempo

**Config:**
```json
{
  "env": {
    "ABLETON_REMOTE_SCRIPT_PORT": "9000"
  }
}
```

---

### ⛏️ Minecraft Pilot

**Minecraft server management**

| Feature | Description |
|:--------|:------------|
| **Server Control** | Start, stop, restart servers |
| **Players** | Player management and stats |
| **Commands** | Execute server commands |
| **Backups** | Automated world backups |

**Tools:**
- `mc_status` - Server status
- `mc_players` - List players
- `mc_command` - Execute commands
- `mc_backup` - Create backups
- `mc_whitelist` - Manage whitelist

**Config:**
```json
{
  "env": {
    "MINECRAFT_RCON_HOST": "localhost",
    "MINECRAFT_RCON_PORT": "25575",
    "MINECRAFT_RCON_PASSWORD": "your-password"
  }
}
```

---

### 🎯 Tarkov Tracker

**Escape from Tarkov game companion**

| Feature | Description |
|:--------|:------------|
| **Items** | Item database and prices |
| **Quests** | Quest tracking and guides |
| **Maps** | Map information and callouts |
| **Hideout** | Hideout upgrade calculator |

**Tools:**
- `tarkov_item` - Search items
- `tarkov_quest` - Quest information
- `tarkov_map` - Map data
- `tarkov_hideout` - Hideout info
- `tarkov_trader` - Trader levels and items

---

### 🎲 Model Forge 3D

**Text-to-3D model generation**

| Feature | Description |
|:--------|:------------|
| **Generation** | Generate 3D models from text |
| **Formats** | Export to OBJ, GLTF, FBX |
| **Texturing** | AI-generated textures |
| **Optimization** | Mesh optimization |

**Tools:**
- `3d_generate` - Generate 3D model from text
- `3d_export` - Export to different formats
- `3d_texture` - Generate textures
- `3d_optimize` - Optimize mesh

**Config:**
```json
{
  "env": {
    "REPLICATE_API_KEY": "your-replicate-key"
  }
}
```

<br/>

---

<br/>

## 🔧 Utility (4 packages)

### 🎭 Master Claude (Orchestrator)

**AI CLI orchestrator for multi-agent workflows**

| Feature | Description |
|:--------|:------------|
| **Task Distribution** | Distribute tasks to agents |
| **Workflow** | Multi-step workflow execution |
| **Coordination** | Coordinate between MCP servers |
| **Results** | Aggregate and present results |

**Tools:**
- `orchestrate_task` - Distribute tasks
- `orchestrate_workflow` - Run workflows
- `orchestrate_parallel` - Parallel execution
- `orchestrate_aggregate` - Aggregate results

---

### 🚀 Sitefast (Deploy)

**Static website deployment automation**

| Feature | Description |
|:--------|:------------|
| **Build** | Build static sites |
| **Deploy** | Deploy to various hosts |
| **SSL** | Automatic SSL setup |
| **CDN** | CDN configuration |

**Tools:**
- `deploy_build` - Build site
- `deploy_publish` - Publish to host
- `deploy_preview` - Create preview deployment
- `deploy_rollback` - Rollback deployment

**Config:**
```json
{
  "env": {
    "NETLIFY_AUTH_TOKEN": "optional",
    "VERCEL_TOKEN": "optional",
    "CLOUDFLARE_API_TOKEN": "optional"
  }
}
```

---

### ⚙️ MCP Server Generator

**Generate new MCP servers from templates**

| Feature | Description |
|:--------|:------------|
| **Templates** | Pre-built server templates |
| **Scaffolding** | Generate boilerplate code |
| **Configuration** | Generate config files |
| **Documentation** | Auto-generate docs |

**Tools:**
- `generator_create` - Create new MCP server
- `generator_add_tool` - Add tool to existing server
- `generator_add_resource` - Add resource
- `generator_docs` - Generate documentation

---

### 📱 Social Media MCP

**Social media automation and analytics**

| Feature | Description |
|:--------|:------------|
| **Posting** | Schedule and publish posts |
| **Analytics** | Track engagement metrics |
| **Monitoring** | Monitor mentions and keywords |
| **Multi-Platform** | Twitter, LinkedIn, Instagram |

**Tools:**
- `social_post` - Create posts
- `social_schedule` - Schedule posts
- `social_analytics` - Get analytics
- `social_monitor` - Monitor keywords

**Config:**
```json
{
  "env": {
    "TWITTER_API_KEY": "optional",
    "TWITTER_API_SECRET": "optional",
    "LINKEDIN_ACCESS_TOKEN": "optional"
  }
}
```

<br/>

---

<br/>

## 🏗️ Architecture

```
mcp-toolkit/
├── 📦 packages/
│   ├── 📊 productivity/     # 9 packages
│   ├── 🛠️ devtools/         # 8 packages
│   ├── 🔒 security/         # 4 packages
│   ├── 🧠 context/          # 6 packages
│   ├── 🎮 media/            # 5 packages
│   └── 🔧 utility/          # 4 packages
│
├── 📄 package.json          # Root package
├── 📄 pnpm-workspace.yaml   # Workspace config
└── 📄 README.md             # This file
```

<br/>

---

<br/>

## 🤝 Contributing

Contributions welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Make** your changes in the appropriate package
4. **Test** your changes (`pnpm test`)
5. **Commit** (`git commit -m 'Add amazing feature'`)
6. **Push** (`git push origin feature/amazing`)
7. **Open** a Pull Request

<br/>

---

<br/>

## 📄 License

<div align="center">

**MIT License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

</div>

<br/>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,3,12&height=100&section=footer"/>

<br/>

**🧰 MCP Toolkit** — *All your MCP servers in one place*

<br/>

*31 packages. 6 categories. Infinite possibilities.*

<br/>

Made with dedication for the Claude Desktop ecosystem

<br/>

[⬆ Back to Top](#-mcp-toolkit)

</div>
