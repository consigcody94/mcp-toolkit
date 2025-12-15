# 🧭 Context Pilot

**MCP Server for Living Project Context** - Solves the #1 AI coding problem: **Missing Context**

[![CI](https://github.com/consigcody94/context-pilot/actions/workflows/ci.yml/badge.svg)](https://github.com/consigcody94/context-pilot/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-2025--06--18-green)](https://modelcontextprotocol.io/)

65% of developers report missing context as their biggest frustration with AI coding assistants. Context Pilot builds comprehensive, semantic understanding of your entire codebase and provides it automatically to AI assistants through the Model Context Protocol (MCP).

## 🔥 The Missing Context Problem

Research shows:
- **65% of developers** cite missing context during refactoring
- **~60%** report missing context during test generation and code review
- **#1 requested feature** (26% of all feedback): "improved contextual understanding"
- AI assistants "reset like a brand new hire" every chat session

**Context Pilot solves this.**

## ✨ Features

### 🧠 Deep Codebase Analysis
- **Semantic Understanding** - Not just file contents, but architectural meaning
- **Dependency Graphs** - Internal module relationships and external packages
- **Pattern Detection** - Identifies architectural patterns, testing approaches, error handling
- **Convention Extraction** - Learns your naming, styling, and organization patterns

### 📊 Comprehensive Context
- **Architecture Detection** - Monolith, microservices, monorepo, library
- **Structure Analysis** - MVC, clean architecture, feature-based, layered
- **Framework Recognition** - Next.js, React, Express, Django, Rails, etc.
- **Database Detection** - PostgreSQL, MongoDB, Redis, SQLite, Prisma, TypeORM

### 🎯 Task-Aware Context
- Get relevant context for specific tasks (refactoring, bug fixes, new features, testing)
- Focus on specific areas or modules
- Automatically includes architectural constraints and conventions

### 🔄 Living Context
- Updates as your codebase evolves
- Learns patterns from your code reviews
- Tracks architectural decisions over time

## 📦 Installation

```bash
npm install -g context-pilot
```

Or use with npx:

```bash
npx context-pilot
```

## 🚀 Quick Start

See [MCP_EXAMPLES.md](MCP_EXAMPLES.md) for comprehensive usage examples.

### Claude Desktop Setup

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context-pilot": {
      "command": "npx",
      "args": ["context-pilot"]
    }
  }
}
```

Restart Claude Desktop.

## 📚 Documentation

- **[MCP Examples](MCP_EXAMPLES.md)** - Real-world usage with Claude Desktop
- **[Architecture](ARCHITECTURE.md)** - System design and components
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## 🛠️ MCP Tools

### analyze_project
Analyze entire codebase to build comprehensive context.

### get_context_summary
High-level project summary (languages, frameworks, file counts).

### get_architecture
Architectural details (type, structure, frameworks, databases).

### get_dependencies
Dependency graph (internal modules and external packages).

### get_conventions
Coding conventions (naming, file organization, code style).

### get_patterns
Detected code patterns (architectural, design, testing).

### search_context
Search across project context for specific information.

### get_relevant_context
Get context most relevant for a specific task.

## 📊 What Gets Analyzed

- **Code Structure** - File organization, module dependencies, exports
- **Architecture** - Type, structure, frameworks, databases
- **Conventions** - Naming patterns, code style, organization
- **Dependencies** - External packages, internal relationships

## 📄 License

MIT - see [LICENSE](LICENSE)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Built to solve the missing context problem that affects 65% of AI-assisted developers.**

Give your AI the context it deserves. ⭐
