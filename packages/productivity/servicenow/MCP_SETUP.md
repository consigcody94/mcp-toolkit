# 🤖 MCP Setup Guide

Complete guide to setting up the ServiceNow Dashboard Generator with Claude Desktop via Model Context Protocol (MCP).

## 📋 Prerequisites

- **Claude Desktop** installed ([Download](https://claude.ai/download))
- **Node.js** 16 or higher
- **Git** for cloning the repository

## 🚀 Installation

### Step 1: Clone and Build

```bash
# Clone the repository
git clone https://github.com/consigcody94/servicenow-dashboard-generator.git
cd servicenow-dashboard-generator

# Install dependencies
npm install

# Build the project
npm run build

# Make the MCP server executable (Linux/macOS)
chmod +x dist/mcp-server.js
```

### Step 2: Configure Claude Desktop

Add the ServiceNow Dashboard Generator to your Claude Desktop MCP configuration.

#### macOS/Linux

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "servicenow-dashboard-generator": {
      "command": "node",
      "args": ["/absolute/path/to/servicenow-dashboard-generator/dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual path to your installation.

#### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "servicenow-dashboard-generator": {
      "command": "node",
      "args": ["C:\\path\\to\\servicenow-dashboard-generator\\dist\\mcp-server.js"],
      "env": {}
    }
  }
}
```

**Important**: Use double backslashes (`\\`) in Windows paths.

### Step 3: Restart Claude Desktop

Close and restart Claude Desktop completely to load the MCP server.

## ✅ Verification

After restarting Claude Desktop, verify the installation:

1. Open Claude Desktop
2. Type: "What ServiceNow dashboard tools do you have?"
3. Claude should list 8 available tools

Expected response should include:
- `create_dashboard`
- `generate_table`
- `generate_widget`
- `quick_dashboard`
- `get_questions`
- `answer_questions`
- `build_config`
- `generate_code`

## 🎯 Usage Examples

### Example 1: Quick Dashboard

Simply ask Claude in natural language:

```
Create a dashboard for tracking active incidents with priority, state, and assignment
```

Claude will use the `quick_dashboard` tool to generate complete ServiceNow code instantly!

### Example 2: Guided Creation

For more control, use the interactive flow:

```
Help me create a ServiceNow dashboard step by step
```

Claude will:
1. Show you all configuration questions
2. Guide you through answering them
3. Build your dashboard configuration
4. Generate the complete code

### Example 3: Amazing Table

Generate a feature-rich table:

```
Create an amazing table for the incident table with these fields: number, short_description, priority, state, assigned_to. Make it sortable and filterable.
```

Claude will generate a beautiful table with:
- Sortable columns
- Filterable data
- Advanced pagination
- Color-coded badges
- Export to CSV
- Responsive design

### Example 4: Custom Widget

Create a specific widget type:

```
Generate a stat widget showing the count of critical incidents
```

Claude will create a KPI card with:
- Large numeric display
- Icon
- Label
- Optional trend indicator

## 🔧 Advanced Configuration

### Environment Variables

You can pass environment variables to customize behavior:

```json
{
  "mcpServers": {
    "servicenow-dashboard-generator": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "DEBUG": "true",
        "DEFAULT_THEME": "dark"
      }
    }
  }
}
```

### Multiple Configurations

You can set up multiple instances with different defaults:

```json
{
  "mcpServers": {
    "servicenow-itsm": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "DEFAULT_TYPE": "service"
      }
    },
    "servicenow-analytics": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "DEFAULT_TYPE": "performance"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### MCP Server Not Found

**Symptom**: Claude says "I don't have access to ServiceNow tools"

**Solutions**:
1. Verify the path in `claude_desktop_config.json` is absolute and correct
2. Check that `dist/mcp-server.js` exists (run `npm run build` if missing)
3. Restart Claude Desktop completely (quit and reopen)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Linux: `~/.config/Claude/logs/`
   - Windows: `%APPDATA%\Claude\logs\`

### Permission Denied (Linux/macOS)

**Symptom**: "Permission denied" error

**Solution**:
```bash
chmod +x dist/mcp-server.js
```

### Node Not Found

**Symptom**: "node: command not found"

**Solution**:
Use absolute path to Node.js:
```json
{
  "command": "/usr/local/bin/node",  // or "/usr/bin/node"
  "args": ["/path/to/dist/mcp-server.js"]
}
```

Find your Node.js path:
```bash
which node
```

### TypeScript Errors

**Symptom**: Build fails with TypeScript errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### JSON Parse Error

**Symptom**: "Unexpected token" or JSON parse error

**Solution**:
Validate your `claude_desktop_config.json`:
```bash
# macOS/Linux
cat ~/.config/Claude/claude_desktop_config.json | python -m json.tool

# Windows PowerShell
Get-Content $env:APPDATA\Claude\claude_desktop_config.json | ConvertFrom-Json
```

## 📊 Testing

Test the MCP server directly:

```bash
# Start the server
node dist/mcp-server.js

# Send a test request (in another terminal)
echo '{"method":"tools/list"}' | node dist/mcp-server.js
```

Expected output: JSON response with 8 tools listed.

## 🔄 Updating

When you update the generator:

```bash
cd servicenow-dashboard-generator
git pull
npm install
npm run build
# Restart Claude Desktop
```

## 💡 Tips for Best Results

### 1. Be Specific

Instead of:
```
"Create a dashboard"
```

Try:
```
"Create a dashboard for the incident table showing number, description, priority, state, and assigned_to fields. Make it sortable and filterable with 25 rows per page."
```

### 2. Use Templates

Reference templates for faster creation:
```
"Use the incident management template but change the refresh interval to 30 seconds"
```

### 3. Iterative Refinement

Generate first, then refine:
```
"Generate a table for incidents"
[Claude generates code]
"Add a filter for active=true and priority=1"
```

### 4. Ask for Explanations

Understand the generated code:
```
"Explain how the sorting feature works in the generated table"
```

## 📚 Natural Language Examples

### Dashboard Creation
- "Create a homepage dashboard with 3 widgets"
- "Build a performance analytics dashboard for tracking SLA compliance"
- "Generate a service portal dashboard for the incident table"

### Table Generation
- "Make an amazing table for change requests"
- "Create a compact table showing top 10 critical incidents"
- "Build a card-style table for mobile users viewing problems"

### Widget Creation
- "Generate a gauge widget for server CPU usage"
- "Create a stat card showing total open tickets"
- "Make a timeline widget for incident history"

### Configuration
- "Show me all the questions for creating a dashboard"
- "What fields are available for the incident table?"
- "List all widget types you support"

## 🎨 Customization Examples

### Custom Theme
```
"Create a dashboard with a dark theme using #1a1a1a background and #00ff00 primary color"
```

### Auto-Refresh
```
"Make the dashboard refresh every 30 seconds"
```

### Export Functionality
```
"Add CSV export to all tables in the dashboard"
```

## 📞 Getting Help

If you encounter issues:

1. **Check Logs**: Review Claude Desktop logs for error messages
2. **GitHub Issues**: [Report bugs](https://github.com/consigcody94/servicenow-dashboard-generator/issues)
3. **Discussions**: [Ask questions](https://github.com/consigcody94/servicenow-dashboard-generator/discussions)
4. **Documentation**: Review [README.md](./README.md) for detailed features

## 🎉 Success!

Once configured, you can create ServiceNow dashboards in seconds with natural language!

Try it out:
```
"Show me what you can do with ServiceNow dashboards"
```

Happy dashboard building! 🚀
