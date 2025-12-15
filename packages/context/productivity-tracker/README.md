# 📊 Dev Mirror

**Track your real developer productivity - AI-assisted vs manual coding, with data-driven insights**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

---

## 🤔 The Question Everyone's Asking

**"Is AI actually making me more productive?"**

Studies claim developers using AI tools are "19% slower" - but raw speed metrics miss the bigger picture. What actually matters:

- ✅ Did the code work on the first try?
- 🔄 How many iterations to get a working solution?
- 🏗️ What was the build success rate?
- 🧠 How often did you context switch?

**Dev Mirror tracks what matters** - objective metrics across your development sessions, then generates comparative reports so you can make data-driven decisions.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Session Tracking** | Start, update, and end development sessions with full metrics |
| 📈 **Statistics Dashboard** | View aggregated stats filtered by type, time range, and tags |
| ⚖️ **AI vs Manual Comparison** | Direct side-by-side comparison of development approaches |
| 🎯 **Quality Scoring** | Objective code quality scores based on multiple factors |
| 📄 **Report Generation** | Comprehensive Markdown or JSON reports with ASCII charts |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Claude Desktop installed

### Installation

```bash
git clone https://github.com/consigcody94/dev-mirror.git
cd dev-mirror
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
    "dev-mirror": {
      "command": "node",
      "args": ["/absolute/path/to/dev-mirror/build/index.js"]
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Start a Coding Session
```
"Start tracking an AI-assisted session for implementing user authentication"
→ Creates session with ID, ready to track your work

"Start a manual coding session for the payment integration"
→ Tracks manual (non-AI) development for comparison
```

### End Session with Metrics
```
"End my session - I added 250 lines, deleted 30, modified 5 files, 15 tests passed, build succeeded"
→ Records all metrics and calculates session statistics
```

### Compare Your Productivity
```
"Compare my AI-assisted vs manual productivity this month"
→ Shows side-by-side comparison of:
   • Average session duration
   • Lines per minute
   • Build success rate
   • Iterations per session
   • Context switches
```

### Generate Reports
```
"Generate a weekly productivity report"
→ Creates comprehensive Markdown report with charts and insights

"What's my code quality score for this week?"
→ Calculates weighted score based on tests, builds, iterations
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `track_session` | Start, update, or end a development session with metrics |
| `get_stats` | Get aggregated productivity statistics with filters |
| `compare_ai_vs_manual` | Generate comparison between AI and manual development |
| `code_quality_score` | Calculate quality score (0-100) for sessions |
| `generate_report` | Create comprehensive Markdown or JSON reports |

---

## 📊 Metrics Tracked

### Per Session
| Metric | Description |
|--------|-------------|
| `linesAdded` | Lines of code added |
| `linesDeleted` | Lines of code deleted |
| `filesModified` | Number of files changed |
| `testsPassed` | Number of passing tests |
| `testsFailed` | Number of failing tests |
| `buildSucceeded` | Whether the build passed |
| `iterationCount` | Number of attempts/iterations |
| `contextSwitches` | Times you switched tasks |

### Aggregated Statistics
- Total sessions (AI vs manual breakdown)
- Total time in minutes
- Average session duration
- Build success rate
- Lines per minute
- Test pass rate

---

## 🏗️ Architecture

```
dev-mirror/
├── src/
│   └── index.ts          # MCP server with all tools
├── build/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Data Storage

Sessions are stored locally in `~/.dev-mirror/sessions.json`:

```json
{
  "id": "session-1234567890",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:30:00.000Z",
  "type": "ai-assisted",
  "task": "Implement user authentication",
  "linesAdded": 250,
  "linesDeleted": 30,
  "filesModified": 5,
  "testsPassed": 15,
  "testsFailed": 0,
  "buildSucceeded": true,
  "iterationCount": 2,
  "contextSwitches": 1,
  "tags": ["backend", "security"]
}
```

---

## 🎯 Use Cases

### For Individual Developers
- Track your actual productivity with objective data
- Compare AI-assisted vs manual coding effectiveness
- Identify patterns in your most productive sessions
- Generate reports for personal retrospectives

### For Teams
- Standardize productivity metrics across team
- Data-driven decisions on AI tool adoption
- Identify training opportunities
- Track improvement over time

### For AI Tool Evaluation
- Objective comparison of different AI assistants
- Measure actual impact on code quality
- Track iteration counts and build success rates
- Generate evidence-based reports

---

## 🔧 Configuration

### Custom Data Directory

```bash
export DEV_MIRROR_DATA_DIR="/path/to/custom/data/directory"
```

Or in Claude Desktop config:

```json
{
  "mcpServers": {
    "dev-mirror": {
      "command": "node",
      "args": ["/path/to/dev-mirror/build/index.js"],
      "env": {
        "DEV_MIRROR_DATA_DIR": "/custom/path"
      }
    }
  }
}
```

### Custom Quality Weights

```json
{
  "weights": {
    "testPassRate": 0.4,
    "buildSuccess": 0.3,
    "lowIterations": 0.2,
    "lowContextSwitches": 0.1
  }
}
```

---

## 🐛 Troubleshooting

### Server won't start

| Issue | Solution |
|-------|----------|
| Node version | Ensure Node.js 18+: `node --version` |
| Build failed | Run `npm run build` |
| Path issues | Use absolute path in Claude Desktop config |

### Data not persisting

| Issue | Solution |
|-------|----------|
| Permissions | Check write permissions to data directory |
| Custom path | Verify `DEV_MIRROR_DATA_DIR` is set correctly |

### Sessions not showing

| Issue | Solution |
|-------|----------|
| Not ended | Ensure sessions are ended with `action: "end"` |
| Filtered out | Check `timeRange` filter isn't excluding sessions |

### Tools not showing in Claude Desktop

1. Check config path is correct
2. Verify absolute path to `build/index.js`
3. Completely restart Claude Desktop (Quit, not just close)
4. Check Claude Desktop logs for errors

---

## 📚 Resources

- [Model Context Protocol](https://github.com/anthropics/mcp)
- [Claude Desktop](https://claude.ai/download)

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
  <i>Stop guessing about your productivity. Start measuring it.</i>
</p>
