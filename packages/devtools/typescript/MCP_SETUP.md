# 🔧 TS Pilot MCP Setup Guide

Complete guide to installing and configuring TS Pilot MCP server with Claude Desktop.

## 📋 Prerequisites

- Node.js 18 or higher
- Claude Desktop application
- npm or yarn package manager

## 📦 Installation

### Option 1: Global Installation (Recommended)

```bash
npm install -g ts-pilot
```

### Option 2: Local Installation

```bash
git clone https://github.com/consigcody94/ts-pilot.git
cd ts-pilot
npm install
npm run build
npm link
```

### Option 3: npx (No Installation)

You can use ts-pilot directly with npx in your Claude Desktop config:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "npx",
      "args": ["ts-pilot"]
    }
  }
}
```

## ⚙️ Claude Desktop Configuration

### macOS Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "ts-pilot"
    }
  }
}
```

**Full path:**
```
/Users/YOUR_USERNAME/Library/Application Support/Claude/claude_desktop_config.json
```

### Linux Configuration

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "ts-pilot"
    }
  }
}
```

### Windows Configuration

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "ts-pilot"
    }
  }
}
```

**Full path:**
```
C:\Users\YOUR_USERNAME\AppData\Roaming\Claude\claude_desktop_config.json
```

### WSL (Windows Subsystem for Linux)

If ts-pilot is installed in WSL, use:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "wsl",
      "args": ["bash", "-c", "cd /home/YOUR_USERNAME && ts-pilot"]
    }
  }
}
```

## ✅ Verification

### 1. Test Installation

```bash
ts-pilot --version
# Should output: ts-pilot v1.0.0 (or current version)
```

### 2. Restart Claude Desktop

After editing the config file, **completely quit and restart Claude Desktop** (not just close the window).

### 3. Verify Tools are Available

In Claude Desktop, ask:
```
What TypeScript tools do you have available?
```

Claude should respond mentioning the 6 TS Pilot tools:
- generate_types
- fix_type_errors
- refactor_safe
- suggest_generics
- check_strict
- framework_patterns

## 🎯 Quick Test

Try these simple tests to ensure everything works:

### Test 1: Type Generation
```
Generate TypeScript types for this JSON:
{
  "id": 1,
  "name": "Test User",
  "email": "test@example.com"
}
```

**Expected Response:**
```typescript
interface Generated {
  id: number;
  name: string;
  email: string;
}
```

### Test 2: Type Error Fix
```
Fix this TypeScript error:
Type 'string | undefined' is not assignable to type 'string'
```

**Expected Response:**
Multiple fix suggestions with explanations

### Test 3: Framework Patterns
```
Show me React TypeScript patterns
```

**Expected Response:**
Multiple React patterns with code examples

## 🔧 Troubleshooting

### Issue: "Command not found: ts-pilot"

**Solution 1:** Add npm global bin to PATH
```bash
npm config get prefix
# Add /usr/local/bin (or output above) to your PATH
```

**Solution 2:** Use full path
```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "/usr/local/bin/ts-pilot"
    }
  }
}
```

**Solution 3:** Use npx instead
```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "npx",
      "args": ["ts-pilot"]
    }
  }
}
```

### Issue: "MCP server not showing in Claude Desktop"

**Checklist:**
1. Verify config file path is correct
2. Ensure JSON is valid (use a JSON validator)
3. Completely quit and restart Claude Desktop
4. Check Claude logs for errors (see Debugging section)

### Issue: "ts-pilot crashes immediately"

**Diagnosis:**
```bash
# Test ts-pilot directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ts-pilot
```

Should output MCP initialize response.

If it crashes, check:
- Node.js version (must be 18+)
- Dependencies installed (`npm install`)
- Build completed (`npm run build`)

### Issue: "Tools not appearing in Claude"

**Solution:**
Verify MCP server is connected:
1. Open Claude Desktop
2. Look for ts-pilot in the MCP servers list (if UI shows it)
3. Ask Claude directly: "What MCP servers are connected?"

### Issue: "Permission denied" errors

**macOS/Linux:**
```bash
chmod +x $(which ts-pilot)
```

**Global install permissions:**
```bash
sudo npm install -g ts-pilot
# or use nvm to avoid sudo
```

## 📊 Debugging

### View Claude Desktop Logs

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Linux:**
```bash
tail -f ~/.config/Claude/logs/mcp*.log
```

**Windows:**
```powershell
Get-Content "$env:APPDATA\Claude\logs\mcp-*.log" -Wait
```

### Test MCP Server Directly

```bash
# Send initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ts-pilot

# Expected: JSON response with protocolVersion, capabilities, serverInfo
```

### Validate JSON Config

```bash
# macOS/Linux
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool

# Windows PowerShell
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json
```

## 🚀 Advanced Configuration

### Multiple MCP Servers

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "ts-pilot"
    },
    "other-mcp-server": {
      "command": "other-server"
    }
  }
}
```

### Custom Port or Settings

TS Pilot uses stdin/stdout for MCP protocol, so no port configuration needed.

### Environment Variables

Currently TS Pilot doesn't use environment variables, but you can set them if needed:

```json
{
  "mcpServers": {
    "ts-pilot": {
      "command": "ts-pilot",
      "env": {
        "NODE_ENV": "production",
        "CUSTOM_VAR": "value"
      }
    }
  }
}
```

## 💡 Usage Tips

### Tip 1: Be Specific with Tool Requests

❌ **Vague:**
```
Help with TypeScript
```

✅ **Specific:**
```
Generate TypeScript types for this API response: {...}
```

### Tip 2: Provide Context

Include relevant code and error messages:
```
I'm getting this TypeScript error in my React component:
"Property 'user' does not exist on type 'Props'"

Here's my code: {...}
```

### Tip 3: Chain Multiple Tools

```
1. Generate types for this API response
2. Check the generated types for strict mode compliance
3. Show me React patterns for using these types
```

### Tip 4: Use for Learning

```
Show me Next.js TypeScript patterns for server actions
Explain the suggested generic constraints
What's the difference between unknown and any?
```

## 🔄 Updating

### Global Installation

```bash
npm update -g ts-pilot
```

### Local Installation

```bash
cd ts-pilot
git pull
npm install
npm run build
```

### Verify Update

```bash
ts-pilot --version
```

Then restart Claude Desktop to load the new version.

## 📚 Resources

- **TS Pilot Repository**: https://github.com/consigcody94/ts-pilot
- **Examples Documentation**: [EXAMPLES.md](./EXAMPLES.md)
- **MCP Protocol Spec**: https://modelcontextprotocol.io/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## 🆘 Getting Help

- **GitHub Issues**: https://github.com/consigcody94/ts-pilot/issues
- **Discussions**: https://github.com/consigcody94/ts-pilot/discussions
- **MCP Community**: https://github.com/modelcontextprotocol

## 🎉 Success!

Once configured, you can ask Claude Desktop:

```
"Generate types for this JSON response"
"Fix this TypeScript error: ..."
"Show me React TypeScript patterns"
"Check this code for strict mode compliance"
"Suggest generic improvements for this function"
"How can I refactor this to be more type-safe?"
```

TS Pilot will provide instant, accurate TypeScript assistance! 🚀
