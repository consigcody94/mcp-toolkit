# 💬 Slack Sage

**AI-powered Slack communication - search messages, read threads, post updates, browse history, and create reminders**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Slack](https://img.shields.io/badge/Slack-Compatible-4A154B?logo=slack)](https://slack.com/)

---

## 🤔 The Communication Challenge

**"Context switching to Slack breaks my focus"**

Every time you need to search for information, catch up on threads, or post updates, you're leaving your workflow.

- 🔍 Searching through message history
- 📖 Reading long thread conversations
- ✍️ Posting updates to channels
- ⏰ Setting reminders manually

**Slack Sage brings Slack to your conversation** - search, read, post, and set reminders without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Message Search** | Full-text search across all channels with Slack syntax |
| 🧵 **Thread Reading** | Get complete thread conversations |
| ✍️ **Message Posting** | Post to channels or reply in threads |
| 📜 **Channel History** | Browse recent messages with timestamp filters |
| ⏰ **Reminders** | Create reminders with natural language timing |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Slack workspace with admin access
- Bot User OAuth Token
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/slack-sage.git
cd slack-sage
npm install
npm run build
```

### Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app and select your workspace
4. Click "Create App"

### Add Bot Token Scopes

Go to "OAuth & Permissions" and add these Bot Token Scopes:

| Scope | Purpose |
|-------|---------|
| `channels:history` | Read messages in public channels |
| `channels:read` | View basic channel info |
| `chat:write` | Post messages |
| `search:read` | Search workspace content |
| `reminders:write` | Create reminders |
| `groups:history` | Read private channels (optional) |
| `im:history` | Read DMs (optional) |

### Install to Workspace

1. Go to "Install App" in your app settings
2. Click "Install to Workspace"
3. Authorize the permissions
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

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
    "slack-sage": {
      "command": "node",
      "args": ["/absolute/path/to/slack-sage/dist/index.js"]
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Search Messages
```
"Search for messages about the API outage from last week"
→ Returns matching messages with context and links

"Find deployment discussions in #engineering from Alice"
→ Uses Slack search syntax: in:#engineering from:@alice deployment
```

### Read Threads
```
"What's the latest in the thread about the release?"
→ Returns full thread conversation with all replies

"Catch me up on the incident response thread"
→ Shows complete thread history
```

### Post Updates
```
"Post an update to #general about the release"
→ Posts formatted message to channel

"Reply to the deployment thread with the status"
→ Posts reply in the thread context
```

### Set Reminders
```
"Remind me tomorrow at 9am to review PRs"
→ Creates Slack reminder with natural language time

"Set a reminder in 30 minutes to check on the build"
→ Creates reminder with relative time
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `search_messages` | Search for messages across all accessible channels |
| `get_thread` | Get all messages in a thread |
| `post_message` | Post a message to a channel or thread |
| `get_channel_history` | Get recent messages from a channel |
| `create_reminder` | Create a reminder for yourself |

---

## 📊 Tool Details

### search_messages

Search for messages across all accessible channels.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query (supports Slack search syntax) |
| `count` | number | No | Number of results (default: 20) |
| `token` | string | Yes | Slack bot token |

**Search Syntax:**

| Modifier | Example | Description |
|----------|---------|-------------|
| `in:#channel` | `in:#general` | Search in specific channel |
| `from:@user` | `from:@alice` | Messages from user |
| `after:date` | `after:2024-01-01` | After date |
| `before:date` | `before:2024-01-31` | Before date |
| `has:link` | `has:link` | Contains links |
| `has:attachment` | `has:attachment` | Contains files |
| `"exact phrase"` | `"release notes"` | Exact phrase match |

### get_thread

Get all messages in a thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID |
| `threadTs` | string | Yes | Thread timestamp (parent message) |
| `token` | string | Yes | Slack bot token |

### post_message

Post a message to a channel or thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID or name |
| `text` | string | Yes | Message text (supports mrkdwn) |
| `threadTs` | string | No | Thread timestamp (to reply in thread) |
| `token` | string | Yes | Slack bot token |

**Message Formatting (mrkdwn):**

| Syntax | Result |
|--------|--------|
| `*bold*` | **bold** |
| `_italic_` | *italic* |
| `~strikethrough~` | ~~strikethrough~~ |
| `` `code` `` | `code` |
| `<@U01234567>` | @mention user |
| `<#C01234567>` | #mention channel |

### get_channel_history

Get recent messages from a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channel` | string | Yes | Channel ID |
| `limit` | number | No | Number of messages (default: 100) |
| `oldest` | string | No | Get messages after this timestamp |
| `token` | string | Yes | Slack bot token |

### create_reminder

Create a reminder for yourself.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Reminder text |
| `time` | string | Yes | When to remind (timestamp or natural language) |
| `token` | string | Yes | Slack bot token |

**Time formats:**
- `in 20 minutes`
- `in 2 hours`
- `tomorrow at 9am`
- `next Monday at 2pm`
- `January 15 at 10am`

---

## 🔑 Finding IDs

### Channel ID
1. Open Slack in browser
2. Go to the channel
3. Channel ID is in URL: `slack.com/archives/C01234567`

### User ID
1. Click on user's profile
2. Click "..." menu → "Copy member ID"

### Thread Timestamp
1. Hover over message → "..." menu → "Copy link"
2. URL contains: `...?thread_ts=1234567890.123456`

---

## 🎯 Workflow Examples

### Morning Catch-up

1. **Search for mentions:**
   ```
   search_messages with query: "from:@me has:reaction", token: "..."
   ```

2. **Read unread threads:**
   ```
   get_thread with channel: "C123", threadTs: "...", token: "..."
   ```

3. **Post standup update:**
   ```
   post_message with channel: "#standup", text: "...", token: "..."
   ```

### Incident Response

1. **Search for related issues:**
   ```
   search_messages with query: "outage in:#incidents after:yesterday", token: "..."
   ```

2. **Get channel history:**
   ```
   get_channel_history with channel: "C-incidents", limit: 100, token: "..."
   ```

3. **Post status update:**
   ```
   post_message with channel: "#incidents", text: "Status update: ...", token: "..."
   ```

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Never commit tokens | Keep tokens out of version control |
| Workspace access | Bot tokens have workspace-wide access |
| Minimum scopes | Use only required scopes |
| Rotate regularly | Change tokens periodically |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "missing_scope" error | Add required scope in app settings, reinstall |
| "channel_not_found" | Verify channel ID, invite bot to channel |
| Search returns nothing | Check `search:read` scope, try broader terms |
| Can't post to channel | Verify `chat:write` scope, invite bot |

---

## 📋 Requirements

- Node.js 18 or higher
- Slack workspace with admin access
- Bot User OAuth Token

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
  <i>Sage advice for your Slack conversations.</i>
</p>
