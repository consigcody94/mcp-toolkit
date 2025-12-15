# MCP Toolkit

> Unified MCP Server Toolkit - 25+ Model Context Protocol servers for Claude Desktop in one monorepo

## Overview

This monorepo contains a comprehensive collection of MCP (Model Context Protocol) servers for use with Claude Desktop and other MCP-compatible AI assistants.

## Package Categories

### Productivity (`packages/productivity/`)
- **sheets** - Google Sheets automation
- **jira** - Jira project management
- **slack** - Slack communication
- **figma** - Figma workflow automation
- **linear** - Linear project management
- **obsidian** - Obsidian knowledge management
- **notion** - Notion workspace automation
- **office** - Microsoft Office Suite control
- **servicenow** - ServiceNow dashboard generator

### Developer Tools (`packages/devtools/`)
- **sql** - Natural language to SQL
- **git** - Git workflow automation
- **repo-health** - Repository health checker
- **worktree** - Git worktree management
- **api** - API mocking and exploration
- **typescript** - TypeScript development
- **docker-k8s** - Docker and Kubernetes control
- **terraform** - Terraform infrastructure management

### Security (`packages/security/`)
- **sentinel** - AI code security scanner
- **code-guardian** - Security scanner for AI-generated code
- **pentest** - Metasploit Framework integration
- **stego** - Steganography and cryptography detection

### Context & Data (`packages/context/`)
- **context** - Living project context
- **memory** - Codebase context vault
- **productivity-tracker** - Developer productivity tracking
- **data-transform** - Universal data transformation
- **news** - News aggregation and analysis
- **space-data** - Space data platform

### Media & Gaming (`packages/media/`)
- **streaming** - OBS Studio and Twitch control
- **ableton** - Ableton Live control
- **minecraft** - Minecraft server control
- **tarkov** - Escape from Tarkov tracker
- **3d-models** - Text-to-3D model generation

### Utility (`packages/utility/`)
- **orchestrator** - AI CLI orchestrator
- **deploy** - Website deployment
- **generator** - MCP server generator
- **social** - Social media automation

## Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/mcp-toolkit.git
cd mcp-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Usage

Each package can be used independently. See individual package READMEs for specific usage instructions.

## License

MIT
