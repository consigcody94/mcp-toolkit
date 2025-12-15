# 🎨 Design Wand

**AI-powered Figma workflow automation - get file details, list components, export assets, manage styles, and track comments**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Figma](https://img.shields.io/badge/Figma-Compatible-F24E1E?logo=figma)](https://www.figma.com/)

---

## 🤔 The Design Workflow Challenge

**"Exporting assets and tracking design changes is tedious"**

Design system management involves constant switching between Figma and your codebase - exporting icons, tracking comments, listing components.

- 🖱️ Manually navigating design files
- 📦 Exporting assets one by one
- 💬 Checking comments in separate panels
- 🔍 Finding component IDs for integration

**Design Wand brings Figma to your conversation** - query files, export assets, and track feedback without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📁 **File Inspection** | Get file metadata and document structure |
| 🧱 **Component Discovery** | List all components with keys and metadata |
| 📤 **Asset Export** | Export nodes as PNG, JPG, SVG, or PDF at multiple scales |
| 🎨 **Style Management** | Update style names and descriptions |
| 💬 **Comment Tracking** | Retrieve and review design comments |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Figma account with Personal Access Token
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/design-wand.git
cd design-wand
npm install
npm run build
```

### Get Your Figma Token

1. Log in to [Figma](https://www.figma.com/)
2. Click your profile icon → Settings
3. Scroll to "Personal access tokens"
4. Click "Generate new token"
5. Copy the token (starts with `figd_`)

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
    "design-wand": {
      "command": "node",
      "args": ["/absolute/path/to/design-wand/dist/index.js"]
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Inspect Design Files
```
"Get the document structure of my landing page design"
→ Returns file metadata, pages, frames, component count

"What's the latest version of the design system file?"
→ Shows version info and last modified timestamp
```

### Export Assets
```
"Export the header icons at 2x scale as PNG"
→ Generates download URLs for specified nodes

"Get all button components as SVG"
→ Exports vector assets for web use
```

### Manage Components
```
"List all components in my design system file"
→ Returns components with keys, names, and node IDs

"Find the icon components in the file"
→ Lists matching components for export
```

### Track Feedback
```
"What comments are unresolved on this file?"
→ Returns unresolved comments with context and authors

"Show me all design review comments"
→ Lists all comments with resolution status
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `get_file` | Get Figma file details and document structure |
| `list_components` | List all components in a Figma file |
| `export_assets` | Export nodes/assets from Figma as images |
| `update_styles` | Update style definitions in a Figma file |
| `get_comments` | Get all comments from a Figma file |

---

## 📊 Tool Details

### get_file

Get Figma file details and document structure.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | Yes | Figma file key from URL |
| `token` | string | Yes | Figma personal access token |

**Response includes:**
- File name and version
- Last modified timestamp
- Thumbnail URL
- Document structure (pages, frames)
- Component and style counts

### list_components

List all components in a Figma file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | Yes | Figma file key |
| `token` | string | Yes | Figma personal access token |

**Response includes:**
- Component key (for referencing)
- Component name
- Description
- Node ID (for export)

### export_assets

Export nodes/assets from Figma as images.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | Yes | Figma file key |
| `nodeIds` | string[] | Yes | Array of node IDs to export |
| `format` | string | Yes | `png`, `jpg`, `svg`, or `pdf` |
| `scale` | number | No | Scale factor 1-4 (default: 1) |
| `token` | string | Yes | Figma personal access token |

**Response includes:**
- Format and scale used
- Download URLs for each node (valid ~30 days)

### update_styles

Update style definitions in a Figma file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | Yes | Figma file key |
| `styleKey` | string | Yes | Style key to update |
| `name` | string | No | New style name |
| `description` | string | No | New description |
| `token` | string | Yes | Figma personal access token |

### get_comments

Get all comments from a Figma file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | Yes | Figma file key |
| `token` | string | Yes | Figma personal access token |

**Response includes:**
- Total comment count
- Resolved vs unresolved counts
- Comment messages, authors, timestamps

---

## 🔑 Finding IDs

### File Key
From URL: `https://www.figma.com/file/ABC123DEF456/My-Design-File`

The file key is: `ABC123DEF456`

### Node ID
1. Select a layer in Figma
2. Right-click → "Copy/Paste" → "Copy link"
3. URL contains: `...?node-id=1:2`

### Node ID Format
- Simple: `"1:2"`, `"23:456"`
- URL-encoded: `"1%3A2"` (colon = `%3A`)

---

## 📤 Export Format Guide

| Format | Best For | Supports Scale |
|--------|----------|----------------|
| `png` | Raster images, icons | Yes (1-4x) |
| `jpg` | Photos, complex images | Yes (1-4x) |
| `svg` | Vector graphics, icons | No (vector) |
| `pdf` | Documents, print | No |

---

## 🎯 Workflow Examples

### Design System Audit

1. **Get file overview:**
   ```
   get_file with fileKey: "ABC123", token: "figd_..."
   ```

2. **List all components:**
   ```
   list_components with fileKey: "ABC123", token: "figd_..."
   ```

3. **Export component previews:**
   ```
   export_assets with fileKey: "ABC123", nodeIds: [...], format: "png", scale: 2, token: "figd_..."
   ```

### Asset Export Pipeline

1. **Find components to export:**
   ```
   list_components with fileKey: "ABC123", token: "figd_..."
   ```

2. **Export at multiple scales:**
   ```
   export_assets with format: "png", scale: 1, ...
   export_assets with format: "png", scale: 2, ...
   export_assets with format: "svg", ...
   ```

### Design Review

1. **Check for unresolved comments:**
   ```
   get_comments with fileKey: "ABC123", token: "figd_..."
   ```

2. **Review file changes:**
   ```
   get_file with fileKey: "ABC123", token: "figd_..."
   ```

---

## ⚡ API Rate Limits

| Plan | Limit |
|------|-------|
| Free | ~30 requests/minute |
| Professional | ~100 requests/minute |
| Organization | Higher limits |

**If you hit limits:**
- Wait 60 seconds before retrying
- Batch node IDs in export requests (up to ~500 per request)
- Cache responses when possible

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Never commit tokens | Keep tokens out of version control |
| Full file access | Tokens access files you can view |
| Rotate regularly | Change tokens periodically |
| Separate tokens | Use different tokens for different apps |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Figma API error (403)" | Verify token is valid and has file access |
| "Node not found" | Check node ID format (`"1:2"` not `"1%3A2"`) |
| Export URLs expired | Re-run export for fresh URLs (~30 day validity) |
| Missing components | Components must be published to file library |

---

## 📋 Requirements

- Node.js 18 or higher
- Figma account
- Personal access token

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
  <i>Wave your wand, export your designs.</i>
</p>
