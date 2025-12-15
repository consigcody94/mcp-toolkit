# 🎯 Master Claude MCP

**Intelligent AI orchestrator that routes queries to the best local AI CLI**

Master Claude is a Model Context Protocol (MCP) server that acts as an intelligent dispatcher for multiple AI models. Instead of manually choosing between Gemini, GPT-4, DeepSeek, Claude, and other AI CLIs, Master Claude automatically selects and routes queries to the optimal model based on your preferences, cost constraints, and query requirements.

## ✨ Features

- 🔍 **Auto-Detection**: Automatically detects installed AI CLI tools (Gemini, OpenAI, DeepSeek, Claude, Anthropic, Codex)
- 🎯 **Smart Routing**: Intelligent query routing based on keywords, capabilities, cost, speed, and quality
- 💰 **Cost Optimization**: Choose the most cost-effective model for your query
- ⚡ **Speed Optimization**: Route to the fastest models when you need quick responses
- 🏆 **Quality Optimization**: Prioritize response quality over cost/speed
- 🤝 **Consensus Mode**: Query multiple models and find consensus among responses
- 📊 **Model Comparison**: Compare responses from different models side-by-side
- ⚙️ **Configurable Rules**: Define custom routing rules based on patterns and keywords
- 🔐 **Authentication Check**: Verifies CLI tools are properly authenticated before use

## 🛠️ Installation

### Prerequisites

- Node.js 18+ installed
- At least one AI CLI tool installed and authenticated:
  - [Gemini CLI](https://ai.google.dev/gemini-api/docs/cli)
  - [OpenAI CLI](https://platform.openai.com/docs/api-reference)
  - [DeepSeek CLI](https://platform.deepseek.com/docs)
  - [Claude CLI](https://claude.ai/cli) or Anthropic CLI
  - [Codex](https://openai.com/blog/openai-codex)

### Install Master Claude

```bash
# Clone the repository
cd ~/projects
git clone <repository-url> master-claude
cd master-claude

# Install dependencies
npm install

# Build the project
npm run build

# Test the server
npm start
```

### Configure as MCP Server

Add to your Claude Code MCP configuration (`~/.config/mcp/servers/master-claude.json`):

```json
{
  "master-claude": {
    "command": "node",
    "args": ["/home/<username>/projects/master-claude/dist/index.js"]
  }
}
```

Or use `npx` for automatic resolution:

```json
{
  "master-claude": {
    "command": "npx",
    "args": ["-y", "master-claude-mcp"]
  }
}
```

## 🚀 Usage

Master Claude provides 7 powerful MCP tools:

### 1. `list_models` - List Available Models

```typescript
// List all detected AI models
mcp.list_models({ authenticated_only: false, refresh: true })

// Example response:
[
  {
    "name": "Gemini Pro",
    "provider": "gemini",
    "available": true,
    "authenticated": true,
    "capabilities": ["chat", "code", "vision", "long-context"],
    "costPerMillionTokens": 0.5,
    "speedRating": 8,
    "qualityRating": 8
  },
  {
    "name": "Claude Sonnet",
    "provider": "claude",
    "available": true,
    "authenticated": true,
    "capabilities": ["chat", "code", "reasoning", "vision", "long-context", "function-calling"],
    "costPerMillionTokens": 3,
    "speedRating": 7,
    "qualityRating": 10
  }
]
```

### 2. `ask_model` - Query Specific Model

```typescript
// Ask a specific model
mcp.ask_model({
  provider: "gemini",
  query: "Explain quantum computing in simple terms",
  context: "User is a beginner in physics"
})
```

### 3. `ask_best` - Auto-Route to Best Model

```typescript
// Let Master Claude choose the best model
mcp.ask_best({
  query: "Write a Python function to calculate fibonacci numbers",
  require_capabilities: ["code"],
  max_cost: 1  // Cost-conscious routing
})

// Master Claude will automatically select DeepSeek (best for code, low cost)
```

### 4. `consensus` - Multi-Model Consensus

```typescript
// Query multiple models and find consensus
mcp.consensus({
  query: "What are the key principles of clean code?",
  min_models: 3,
  max_models: 5
})

// Returns responses from 3-5 top models with confidence score
```

### 5. `compare_models` - Side-by-Side Comparison

```typescript
// Compare specific models
mcp.compare_models({
  providers: ["gemini", "claude", "deepseek"],
  query: "What is the difference between async/await and promises?"
})
```

### 6. `get_config` - View Configuration

```typescript
// See current routing rules and optimization settings
mcp.get_config({})
```

### 7. `update_config` - Modify Configuration

```typescript
// Update routing rules
mcp.update_config({
  config: {
    costOptimization: true,
    speedOptimization: false,
    qualityOptimization: true
  }
})
```

## ⚙️ Configuration

Master Claude uses intelligent routing rules to select the best model. Default rules:

```json
{
  "routingRules": [
    {
      "keywords": ["code", "programming", "debug"],
      "preferredProvider": "deepseek",
      "requireCapabilities": ["code"]
    },
    {
      "keywords": ["explain", "analyze", "reasoning"],
      "preferredProvider": "claude",
      "requireCapabilities": ["reasoning"]
    },
    {
      "keywords": ["quick", "fast", "simple"],
      "preferredProvider": "gemini",
      "maxCost": 1
    },
    {
      "keywords": ["image", "picture", "visual"],
      "requireCapabilities": ["vision"]
    }
  ],
  "costOptimization": true,
  "speedOptimization": false,
  "qualityOptimization": true,
  "enableConsensus": false,
  "consensusMinModels": 3,
  "consensusMaxModels": 5
}
```

Configuration is stored at `~/.config/master-claude/config.json`.

## 🎯 Routing Logic

Master Claude scores each model based on:

1. **Capability Matching** (+20 points): Must have required capabilities
2. **Provider Preference** (+30 points): Matches routing rule preference
3. **Cost Optimization** (0-30 points): Lower cost = higher score (if enabled)
4. **Speed Optimization** (0-30 points): Based on speedRating (if enabled)
5. **Quality Optimization** (0-40 points): Based on qualityRating (if enabled)

The model with the highest score wins!

## 📊 Model Capabilities

| Provider | Code | Reasoning | Vision | Long Context | Speed | Quality | Cost |
|----------|------|-----------|--------|--------------|-------|---------|------|
| Gemini Pro | ✅ | ⚪ | ✅ | ✅ | 8/10 | 8/10 | $0.50 |
| GPT-4 | ✅ | ✅ | ✅ | ⚪ | 6/10 | 9/10 | $30.00 |
| DeepSeek | ✅ | ✅ | ⚪ | ⚪ | 9/10 | 8/10 | $0.14 |
| Claude | ✅ | ✅ | ✅ | ✅ | 7/10 | 10/10 | $3.00 |

*Cost = per million tokens*

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode with watch
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
master-claude/
├── src/
│   ├── index.ts         # MCP server entry point
│   ├── detector.ts      # AI CLI detection
│   ├── router.ts        # Intelligent routing logic
│   ├── executor.ts      # Query execution
│   ├── config.ts        # Configuration management
│   └── types.ts         # TypeScript interfaces
├── dist/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🎓 Use Cases

### Use Case 1: Cost-Conscious Development

```typescript
// Use cheap models for simple queries
mcp.ask_best({
  query: "What does this error mean: TypeError: Cannot read property 'map' of undefined",
  max_cost: 1  // Will route to DeepSeek ($0.14) or Gemini ($0.50)
})
```

### Use Case 2: Maximum Quality for Critical Decisions

```typescript
// Use highest quality model for important questions
mcp.update_config({
  config: {
    costOptimization: false,
    qualityOptimization: true
  }
})

mcp.ask_best({
  query: "Should I use microservices or monolith for my startup?"
  // Will route to Claude (10/10 quality)
})
```

### Use Case 3: Verify Critical Information

```typescript
// Get consensus from multiple models for fact-checking
mcp.consensus({
  query: "What are the OWASP Top 10 security vulnerabilities in 2024?",
  min_models: 3
})

// Returns responses from 3+ models with confidence score
```

### Use Case 4: Model A/B Testing

```typescript
// Compare how different models handle the same task
mcp.compare_models({
  providers: ["gemini", "claude", "deepseek"],
  query: "Refactor this code to use async/await instead of callbacks"
})
```

## 🛡️ Security

- ✅ All AI CLI authentication is handled by the respective CLI tools
- ✅ No API keys stored in Master Claude (uses existing CLI auth)
- ✅ Commands executed with proper escaping and timeouts
- ✅ Configuration stored locally in `~/.config/master-claude/`

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Designed for use with [Claude Code](https://claude.ai/code)
- Inspired by the need to intelligently orchestrate multiple AI models

---

**Made with ❤️ for the AI developer community**

*Master Claude: Your intelligent AI dispatcher, routing queries to the perfect model every time.*
