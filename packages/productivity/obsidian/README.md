# 🕸️ Vault Weaver

**AI-powered Obsidian knowledge management - create notes, search content, discover backlinks, and visualize your knowledge graph**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Obsidian](https://img.shields.io/badge/Obsidian-Compatible-7C3AED?logo=obsidian)](https://obsidian.md/)

---

## 🤔 The Knowledge Challenge

**"My notes are scattered and disconnected"**

You've built a vault of hundreds of notes, but finding connections and maintaining structure is overwhelming.

- 🔍 Manually searching through notes
- 🔗 Missing connections between topics
- 📝 Inconsistent metadata and tags
- 🗂️ Difficulty maintaining structure

**Vault Weaver bridges your vault with AI** - search, create, link, and visualize your knowledge through natural language.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Note Creation** | Create markdown notes with YAML frontmatter and folder organization |
| 🔍 **Full-Text Search** | Search by content, title, tags, or folder |
| 🔗 **Backlink Discovery** | Find all notes that reference a specific note |
| 🕸️ **Graph Visualization** | Generate connection graphs with configurable depth |
| 📋 **Frontmatter Management** | Update metadata on existing notes |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Obsidian vault (local folder)
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/vault-weaver.git
cd vault-weaver
npm install
npm run build
```

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
    "vault-weaver": {
      "command": "node",
      "args": ["/absolute/path/to/vault-weaver/build/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/obsidian/vault"
      }
    }
  }
}
```

**Finding your vault path:**
| Platform | Typical Location |
|----------|------------------|
| macOS | `~/Documents/Obsidian/YourVaultName` |
| Windows | `C:\Users\YourName\Documents\Obsidian\YourVaultName` |
| Linux | `~/Documents/Obsidian/YourVaultName` |

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Create Notes
```
"Create a meeting note for today's standup with attendees and action items"
→ Creates note with proper frontmatter, folder organization, and structure

"Add a new research note about machine learning with tags for AI and papers"
→ Creates tagged note in research folder with YAML frontmatter
```

### Search Your Vault
```
"Find all my notes about machine learning"
→ Returns matching notes with relevant snippets

"Search for active projects tagged with 'priority'"
→ Filters by tag and returns project notes
```

### Discover Connections
```
"What notes link to my project roadmap?"
→ Finds all backlinks with context

"Show me the knowledge graph around my 'productivity' note"
→ Generates visual connection map
```

### Manage Metadata
```
"Update the status to 'completed' on my API redesign note"
→ Merges new frontmatter with existing

"Add tags 'done' and 'q1' to the feature spec"
→ Updates YAML frontmatter
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `create_note` | Create a new markdown note with frontmatter |
| `search_notes` | Search notes by content, title, tags, or folder |
| `get_backlinks` | Find all notes that link to a specific note |
| `create_graph` | Generate a graph of note connections |
| `update_frontmatter` | Update or add YAML frontmatter to existing notes |

---

## 📊 Tool Details

### create_note

Create a new markdown note in your vault.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Note title (used as filename) |
| `content` | string | Yes | Note content in markdown |
| `folder` | string | No | Folder path relative to vault root |
| `frontmatter` | object | No | YAML frontmatter metadata |

**Example with frontmatter:**

```json
{
  "title": "Meeting Notes 2024-01-15",
  "content": "# Team Sync\n\n## Attendees\n- Alice\n- Bob\n\n## Action Items\n- [ ] Review PRs",
  "folder": "meetings/2024",
  "frontmatter": {
    "tags": ["meeting", "team"],
    "date": "2024-01-15",
    "type": "meeting"
  }
}
```

### search_notes

Search notes by content, title, tags, or folder.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query (searches content and title) |
| `tag` | string | No | Filter by specific tag |
| `folder` | string | No | Filter by folder path |
| `limit` | number | No | Max results (default: 10, max: 100) |

### get_backlinks

Find all notes that link to a specific note using `[[wikilinks]]`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notePath` | string | Yes | Path to note relative to vault root |

### create_graph

Generate a graph of note connections.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rootNote` | string | No | Starting note (omit for entire vault) |
| `depth` | number | No | Traversal depth (default: 2, max: 5) |

### update_frontmatter

Update or add YAML frontmatter to an existing note.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notePath` | string | Yes | Path to note relative to vault root |
| `frontmatter` | object | Yes | Frontmatter fields to update |
| `merge` | boolean | No | Merge with existing (default: true) |

---

## 🎯 Workflow Examples

### Daily Note Workflow

1. **Create today's note:**
   ```
   create_note with title: "2024-01-15", folder: "daily", frontmatter: {date: "2024-01-15", type: "daily"}
   ```

2. **Link to relevant projects:**
   ```
   search_notes with query: "current sprint", tag: "active"
   ```

3. **Check what links to yesterday:**
   ```
   get_backlinks with notePath: "daily/2024-01-14.md"
   ```

### Research Organization

1. **Create research note:**
   ```
   create_note with title: "ML Paper Review", folder: "research", frontmatter: {tags: ["ml", "paper"]}
   ```

2. **Find related notes:**
   ```
   search_notes with query: "neural network", limit: 10
   ```

3. **Visualize connections:**
   ```
   create_graph with rootNote: "research/ML Paper Review.md", depth: 2
   ```

---

## 🔗 Obsidian Compatibility

| Feature | Support |
|---------|---------|
| `[[Wikilinks]]` | ✅ Full support including aliases |
| `#tags` | ✅ Both inline and frontmatter |
| YAML Frontmatter | ✅ Full support via gray-matter |
| Folders | ✅ Complete hierarchy support |
| `![[Embeds]]` | ✅ Embed syntax recognition |

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Local only | Only accesses the specified vault directory |
| No external calls | No data sent to external services |
| File system only | All operations are local |
| Backup recommended | Backup your vault before bulk operations |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "OBSIDIAN_VAULT_PATH required" | Set the environment variable in Claude Desktop config |
| Notes not appearing | Reload Obsidian or check file permissions |
| Search returns nothing | Try broader search terms, check excluded folders |
| Backlinks missing | Ensure proper `[[wikilink]]` syntax |

---

## 📋 Requirements

- Node.js 18 or higher
- Obsidian vault (local file system access)
- Read/write permissions to vault directory

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
  <i>Weave your knowledge into a connected web.</i>
</p>
