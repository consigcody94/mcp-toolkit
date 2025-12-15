# 📦 Master Claude Installation Guide

Complete step-by-step guide to installing and configuring Master Claude MCP.

## Prerequisites

### 1. Install Node.js 18+

```bash
# Check Node version
node --version  # Should be v18.0.0 or higher

# If needed, install/update Node.js
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (using Homebrew):
brew install node@20
```

### 2. Install AI CLI Tools

You need at least one AI CLI tool installed and authenticated. More tools = better routing options!

#### Gemini CLI
```bash
# Install
npm install -g @google/generative-ai-cli

# Authenticate
gemini config set api-key YOUR_API_KEY

# Test
gemini chat "Hello, Gemini!"
```

#### OpenAI CLI
```bash
# Install
pip install openai

# Authenticate
export OPENAI_API_KEY=your_api_key_here

# Test
openai chat "Hello, GPT!"
```

#### DeepSeek CLI
```bash
# Install (check official docs for latest)
npm install -g deepseek-cli

# Authenticate
deepseek auth login

# Test
deepseek chat "Hello, DeepSeek!"
```

#### Claude CLI / Anthropic CLI
```bash
# Option 1: Claude CLI
# Download from https://claude.ai/cli

# Option 2: Anthropic CLI
pip install anthropic-cli

# Authenticate
claude auth login
# or
anthropic auth login

# Test
claude chat "Hello, Claude!"
```

#### Codex
```bash
# Install
npm install -g codex-cli

# Authenticate (uses OpenAI key)
export OPENAI_API_KEY=your_api_key_here

# Test
codex complete "def fibonacci"
```

## Install Master Claude

### Method 1: Clone from GitHub (Recommended for Development)

```bash
# Clone repository
cd ~/projects
git clone https://github.com/consigcody94/master-claude.git
cd master-claude

# Install dependencies
npm install

# Build
npm run build

# Test the server
npm start
# Press Ctrl+C to stop
```

### Method 2: Install from npm (Coming Soon)

```bash
# Install globally
npm install -g master-claude-mcp

# Run
master-claude
```

## Configure Claude Code

### Step 1: Create MCP Server Config

Edit or create `~/.config/mcp/servers/master-claude.json`:

```json
{
  "master-claude": {
    "command": "node",
    "args": ["/home/YOUR_USERNAME/projects/master-claude/dist/index.js"]
  }
}
```

**Important**: Replace `/home/YOUR_USERNAME/` with your actual home directory path!

To get your full path:
```bash
cd ~/projects/master-claude
pwd
# Use the output in the config above
```

### Step 2: Alternative Config (if using npx)

```json
{
  "master-claude": {
    "command": "npx",
    "args": ["-y", "master-claude-mcp"]
  }
}
```

### Step 3: Restart Claude Code

After adding the MCP server configuration, restart Claude Code to load Master Claude.

## Verify Installation

### Test 1: List Models

In Claude Code, use the Master Claude MCP:

```typescript
mcp.list_models({ authenticated_only: true })
```

You should see a list of available AI models. Example:

```json
[
  {
    "name": "Gemini Pro",
    "provider": "gemini",
    "available": true,
    "authenticated": true,
    "capabilities": ["chat", "code", "vision", "long-context"]
  }
]
```

### Test 2: Ask a Question

```typescript
mcp.ask_best({
  query: "What is 2 + 2?"
})
```

You should get a response routed through one of your authenticated models.

### Test 3: Check Configuration

```typescript
mcp.get_config({})
```

You should see the default routing rules and optimization settings.

## Configuration

### Default Config Location

Master Claude stores configuration at: `~/.config/master-claude/config.json`

The first time you use `update_config`, this file will be created automatically.

### Customize Routing Rules

```typescript
mcp.update_config({
  config: {
    routingRules: [
      {
        keywords: ["code", "programming"],
        preferredProvider: "deepseek",
        requireCapabilities: ["code"]
      },
      {
        keywords: ["reasoning", "explain"],
        preferredProvider: "claude",
        minQuality: 9
      }
    ],
    costOptimization: true,
    speedOptimization: false,
    qualityOptimization: true
  }
})
```

### Optimization Modes

**Cost Optimization** (Default: `true`)
- Prefers cheaper models (DeepSeek $0.14 > Gemini $0.50 > Claude $3 > GPT-4 $30)

**Speed Optimization** (Default: `false`)
- Prefers faster models (DeepSeek 9/10 > Gemini 8/10 > Claude 7/10)

**Quality Optimization** (Default: `true`)
- Prefers higher quality models (Claude 10/10 > GPT-4 9/10 > Gemini/DeepSeek 8/10)

Enable multiple optimizations and Master Claude will balance them in the scoring algorithm!

## Troubleshooting

### Problem: "No models available"

**Solution**: At least one AI CLI must be installed and authenticated.

```bash
# Check which commands are available
which gemini
which openai
which deepseek
which claude

# Test authentication
gemini chat "test"
```

### Problem: "Error executing query"

**Solution**: The AI CLI might not be in your PATH or authentication expired.

```bash
# Add to PATH (if needed)
export PATH="$PATH:$HOME/.local/bin"

# Re-authenticate
gemini config set api-key YOUR_KEY
# or
openai api key set YOUR_KEY
```

### Problem: "Module not found" when starting server

**Solution**: Make sure you ran `npm install` and `npm run build`

```bash
cd ~/projects/master-claude
npm install
npm run build
```

### Problem: MCP server not loading in Claude Code

**Solution**:
1. Check the path in `~/.config/mcp/servers/master-claude.json` is correct
2. Restart Claude Code completely
3. Check Claude Code logs for errors

## Usage Examples

### Example 1: Cost-Conscious Queries

```typescript
// Use cheapest model for simple questions
mcp.ask_best({
  query: "What does HTTP stand for?",
  max_cost: 1  // Will use DeepSeek ($0.14) or Gemini ($0.50)
})
```

### Example 2: High-Quality Reasoning

```typescript
// Use best model for important decisions
mcp.update_config({
  config: {
    costOptimization: false,
    qualityOptimization: true
  }
})

mcp.ask_best({
  query: "Should I use microservices or monolith architecture?"
  // Will route to Claude (10/10 quality)
})
```

### Example 3: Get Multiple Opinions

```typescript
// Ask 3-5 models and get consensus
mcp.consensus({
  query: "What are the OWASP Top 10 vulnerabilities?",
  min_models: 3,
  max_models: 5
})
```

### Example 4: Compare Specific Models

```typescript
// See how different models answer the same question
mcp.compare_models({
  providers: ["gemini", "claude", "deepseek"],
  query: "Explain the difference between let, const, and var in JavaScript"
})
```

## Next Steps

- ✅ Explore routing rules customization
- ✅ Try consensus mode for fact-checking
- ✅ Compare model responses side-by-side
- ✅ Optimize for your use case (cost/speed/quality)
- ✅ Add more AI CLI tools for better coverage

## Support

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/consigcody94/master-claude/issues)
- 💬 [Discussions](https://github.com/consigcody94/master-claude/discussions)

---

**Happy orchestrating! 🎯**
