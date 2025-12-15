# 🔧 MCP Setup Guide - Minecraft Pilot

Complete guide to installing and configuring Minecraft Pilot as an MCP server for Claude Desktop.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Minecraft Server Setup](#minecraft-server-setup)
- [Minecraft Pilot Installation](#minecraft-pilot-installation)
- [Claude Desktop Configuration](#claude-desktop-configuration)
- [Testing Your Setup](#testing-your-setup)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

### Required Software

1. **Minecraft Java Edition Server**
   - Version 1.8 or later (RCON support required)
   - Download: https://www.minecraft.net/en-us/download/server

2. **Node.js and npm**
   - Version 16.x or later
   - Download: https://nodejs.org/

3. **Claude Desktop**
   - Latest version recommended
   - Download: https://claude.ai/download

4. **Git** (for installation)
   - Download: https://git-scm.com/downloads

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 2GB minimum (4GB+ recommended for Minecraft server)
- **Disk Space**: 500MB for Minecraft Pilot + dependencies
- **Network**: Local network access between Claude Desktop, Minecraft Pilot, and Minecraft server

## Minecraft Server Setup

### Step 1: Install Minecraft Server

#### Option A: Fresh Installation

```bash
# Create server directory
mkdir minecraft-server
cd minecraft-server

# Download server JAR (replace URL with latest version)
wget https://launcher.mojang.com/v1/objects/[version-hash]/server.jar

# Accept EULA
echo "eula=true" > eula.txt

# Start server to generate files
java -Xmx1024M -Xms1024M -jar server.jar nogui
```

#### Option B: Existing Server

If you already have a Minecraft server, skip to Step 2.

### Step 2: Enable RCON

Edit `server.properties` in your Minecraft server directory:

```properties
# RCON Configuration
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password_here

# Optional: Change broadcast RCON to clients
broadcast-rcon-to-ops=true

# Server settings (adjust as needed)
server-port=25565
gamemode=survival
difficulty=normal
max-players=20
```

**Important Configuration Notes**:

1. **RCON Password**: Choose a strong password (16+ characters recommended)
   - Good: `Mc$erv3r_P@ssw0rd!2024`
   - Bad: `password`, `123456`, `admin`

2. **RCON Port**: Default is 25575
   - Must be different from server-port (usually 25565)
   - Change if you run multiple servers on same machine

3. **Network Binding**: RCON listens on all interfaces by default
   - Firewall rules should restrict access to localhost only

### Step 3: Configure Firewall (If Needed)

#### Linux (ufw)
```bash
# Allow Minecraft server port (if remote access needed)
sudo ufw allow 25565/tcp

# DO NOT expose RCON port to internet
# Only allow local connections (default)
```

#### Windows Firewall
```powershell
# Allow Minecraft server port
New-NetFirewallRule -DisplayName "Minecraft Server" -Direction Inbound -Protocol TCP -LocalPort 25565 -Action Allow

# RCON port should NOT be exposed
```

#### macOS
```bash
# macOS firewall typically allows local connections by default
# No action needed for localhost RCON
```

### Step 4: Restart Minecraft Server

```bash
# Stop server (in server console)
stop

# Start server with RCON enabled
java -Xmx1024M -Xms1024M -jar server.jar nogui
```

**Verify RCON is enabled**: Check `server.log` for:
```
[Server thread/INFO]: RCON running on 0.0.0.0:25575
```

### Step 5: Test RCON Connection

Use `mcrcon` to verify RCON is working:

```bash
# Install mcrcon
npm install -g mcrcon

# Test connection
mcrcon -H localhost -P 25575 -p your_secure_password_here "list"

# Expected output:
# There are 0 of a max of 20 players online:
```

If you see player list, RCON is configured correctly!

## Minecraft Pilot Installation

### Step 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/consigcody94/minecraft-pilot.git
cd minecraft-pilot
```

### Step 2: Install Dependencies

```bash
# Install npm packages
npm install

# This installs:
# - rcon-client: RCON protocol implementation
# - TypeScript: Type-safe development
# - Testing and linting tools
```

**Expected output**:
```
added 384 packages, and audited 385 packages in 15s
0 vulnerabilities
```

### Step 3: Build Project

```bash
# Compile TypeScript to JavaScript
npm run build

# Expected output:
# (no output means success)
```

**Verify build**:
```bash
ls -l dist/
# Should see:
# - mcp-server.js (main MCP server)
# - index.js (public API)
# - types.js, rcon/, parsers/ (supporting files)
```

### Step 4: Test Installation

```bash
# Test that MCP server can start
node dist/mcp-server.js --version

# Or test connection manually (optional)
node -e "
const { MinecraftRCONClient } = require('./dist/index.js');
const client = new MinecraftRCONClient({
  host: 'localhost',
  port: 25575,
  password: 'your_password'
});
client.connect().then(() => {
  console.log('✓ Connected to Minecraft server');
  client.disconnect();
}).catch(err => {
  console.error('✗ Connection failed:', err.message);
});
"
```

### Step 5: Global Installation (Optional)

For easier access from anywhere:

```bash
# Link globally
npm link

# Now you can run from any directory
minecraft-pilot --help
```

## Claude Desktop Configuration

### Step 1: Locate Config File

Claude Desktop stores MCP server configurations in a JSON file:

| Platform | Config File Location |
|----------|---------------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

**Find path programmatically**:

```bash
# macOS/Linux
echo "Config: $HOME/Library/Application Support/Claude/claude_desktop_config.json"  # macOS
echo "Config: $HOME/.config/Claude/claude_desktop_config.json"  # Linux

# Windows (PowerShell)
echo "Config: $env:APPDATA\Claude\claude_desktop_config.json"
```

### Step 2: Create/Edit Config File

**If file doesn't exist**, create it:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
mkdir -p ~/.config/Claude
touch ~/.config/Claude/claude_desktop_config.json

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
New-Item -ItemType File -Force -Path "$env:APPDATA\Claude\claude_desktop_config.json"
```

### Step 3: Add Minecraft Pilot Configuration

**Basic Configuration** (localhost):

```json
{
  "mcpServers": {
    "minecraft-pilot": {
      "command": "node",
      "args": ["/absolute/path/to/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "localhost",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "your_secure_password_here"
      }
    }
  }
}
```

**Get absolute path**:

```bash
# From minecraft-pilot directory
pwd
# Example output: /Users/username/projects/minecraft-pilot

# Use this in config:
# /Users/username/projects/minecraft-pilot/dist/mcp-server.js
```

**Full Example Configurations**:

#### macOS Configuration
```json
{
  "mcpServers": {
    "minecraft-pilot": {
      "command": "node",
      "args": ["/Users/john/projects/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "localhost",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "Mc$erv3r_P@ssw0rd!2024"
      }
    }
  }
}
```

#### Windows Configuration
```json
{
  "mcpServers": {
    "minecraft-pilot": {
      "command": "node",
      "args": ["C:\\Users\\john\\projects\\minecraft-pilot\\dist\\mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "localhost",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "Mc$erv3r_P@ssw0rd!2024"
      }
    }
  }
}
```

#### Linux Configuration
```json
{
  "mcpServers": {
    "minecraft-pilot": {
      "command": "node",
      "args": ["/home/john/projects/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "localhost",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "Mc$erv3r_P@ssw0rd!2024"
      }
    }
  }
}
```

**Important Notes**:

1. **Absolute Paths Required**: Relative paths like `./dist/mcp-server.js` will NOT work
2. **Windows Paths**: Use double backslashes `\\` or forward slashes `/`
3. **Spaces in Paths**: Enclosed in quotes automatically by JSON
4. **No Trailing Commas**: JSON requires strict syntax

### Step 4: Validate Config File

```bash
# Validate JSON syntax
cat claude_desktop_config.json | jq .

# Expected output: pretty-printed JSON
# If error: "parse error" means invalid JSON
```

**Common JSON errors**:
- Missing comma between properties
- Trailing comma after last property
- Unescaped backslashes in Windows paths
- Unquoted property names

### Step 5: Restart Claude Desktop

**Complete restart required** (not just close window):

#### macOS
```bash
# Quit Claude Desktop completely
osascript -e 'quit app "Claude"'

# Or use Cmd+Q

# Reopen
open -a Claude
```

#### Windows
```powershell
# Close from system tray (right-click → Quit)
# Or kill process
taskkill /F /IM claude.exe

# Reopen from Start Menu
```

#### Linux
```bash
# Kill Claude process
pkill -f claude

# Reopen
claude &
```

## Testing Your Setup

### Level 1: Verify Tools Are Loaded

1. Open Claude Desktop
2. Start a new conversation
3. Look for tool indicators in the conversation

**Expected behavior**: You should see minecraft-pilot tools available.

### Level 2: Test Connection

Ask Claude:

```
Connect to my Minecraft server at localhost with password [your_password]
```

**Expected response**:
```
✓ Connected to Minecraft Server
Host: localhost:25575
Status: Connected and ready
```

### Level 3: Test Basic Commands

#### List Players
```
List all online players
```

#### Natural Language Command
```
Give Steve a diamond sword
```

**Expected response**:
```
🤖 Natural Language Translation

Your Request: "Give Steve a diamond sword"
Detected Action: give_item
Generated Command: give Steve minecraft:diamond_sword 1

✅ Execution Result
```

#### Set Time
```
Set the time to day
```

### Level 4: Test Complex Workflow

```
Connect to my Minecraft server,
then list all online players,
then give each player a diamond sword,
then set the time to noon,
then broadcast a message saying "Welcome to the server!"
```

This tests:
- Connection management
- Tool chaining
- Natural language understanding
- Multiple command execution

## Advanced Configuration

### Multiple Minecraft Servers

Configure multiple servers with different names:

```json
{
  "mcpServers": {
    "minecraft-survival": {
      "command": "node",
      "args": ["/path/to/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "192.168.1.100",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "survival_password"
      }
    },
    "minecraft-creative": {
      "command": "node",
      "args": ["/path/to/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "192.168.1.101",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "creative_password"
      }
    }
  }
}
```

Usage:
```
Connect to minecraft-survival and list players
Connect to minecraft-creative and set time to night
```

### Remote Minecraft Server

Connect to a Minecraft server on another machine:

```json
{
  "mcpServers": {
    "minecraft-remote": {
      "command": "node",
      "args": ["/path/to/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "minecraft.example.com",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "remote_password",
        "MINECRAFT_TIMEOUT": "10000"
      }
    }
  }
}
```

**Security Warning**: RCON is unencrypted. Only use remote connections over:
- VPN tunnel
- SSH tunnel
- Private network

**SSH Tunnel Example**:
```bash
# Create tunnel: local 25575 → remote 25575
ssh -L 25575:localhost:25575 user@minecraft.example.com

# Then connect to localhost:25575 (tunneled to remote)
```

### Custom Timeout Values

For slow servers or high-latency connections:

```json
{
  "env": {
    "MINECRAFT_HOST": "localhost",
    "MINECRAFT_PORT": "25575",
    "MINECRAFT_PASSWORD": "password",
    "MINECRAFT_TIMEOUT": "15000"
  }
}
```

Timeout values:
- Default: 5000ms (5 seconds)
- Recommended: 5000-10000ms
- High latency: 10000-15000ms
- Maximum: 30000ms (30 seconds)

### Debug Logging

Enable detailed logging for troubleshooting:

```json
{
  "env": {
    "MINECRAFT_HOST": "localhost",
    "MINECRAFT_PORT": "25575",
    "MINECRAFT_PASSWORD": "password",
    "DEBUG": "minecraft-pilot:*"
  }
}
```

View logs in Claude Desktop log directory.

## Troubleshooting

### Issue: Tools Not Appearing in Claude Desktop

**Symptoms**: minecraft-pilot tools don't show up in conversation

**Diagnosis**:
1. Check Claude Desktop logs:
   ```bash
   # macOS
   tail -f ~/Library/Logs/Claude/mcp*.log

   # Windows
   type %APPDATA%\Claude\logs\mcp*.log

   # Linux
   tail -f ~/.config/Claude/logs/mcp*.log
   ```

2. Look for errors like:
   - `Cannot find module` → Wrong path in config
   - `ENOENT` → File doesn't exist
   - `SyntaxError` → Invalid JSON in config

**Solutions**:
- Verify absolute path is correct
- Check file permissions (must be readable)
- Validate JSON syntax with `jq`
- Restart Claude Desktop completely (Quit from tray)

### Issue: "Failed to connect to RCON"

**Symptoms**: Error when trying to connect to Minecraft server

**Diagnosis**:
```bash
# Test RCON directly
mcrcon -H localhost -P 25575 -p your_password "list"
```

**Solutions**:

1. **RCON not enabled**:
   - Check `enable-rcon=true` in server.properties
   - Restart Minecraft server

2. **Wrong password**:
   - Verify password in server.properties matches config
   - Check for special characters (escape if needed)

3. **Wrong port**:
   - Default RCON port is 25575
   - Check `rcon.port` in server.properties

4. **Firewall blocking**:
   - RCON uses TCP, check firewall rules
   - For localhost, firewall usually not an issue

5. **Server not running**:
   - Verify Minecraft server is actually running
   - Check server logs for errors

### Issue: "Connection timeout"

**Symptoms**: Commands take too long, timeout errors

**Diagnosis**:
- Check server TPS (ticks per second):
  ```
  /forge tps  (if Forge server)
  ```
- Normal: 20 TPS
- Slow: <15 TPS

**Solutions**:
1. Increase timeout in config:
   ```json
   "MINECRAFT_TIMEOUT": "10000"
   ```

2. Optimize server performance:
   - Reduce view-distance in server.properties
   - Allocate more RAM: `-Xmx2G -Xms2G`
   - Remove unnecessary plugins/mods

3. Check network latency:
   ```bash
   ping minecraft.example.com
   ```

### Issue: Natural Language Not Understood

**Symptoms**: Claude doesn't correctly interpret commands

**Diagnosis**:
- Check what command was generated (shown in response)

**Solutions**:

1. **Be more explicit**:
   - "give diamond" → "give Steve a diamond sword"
   - "teleport" → "teleport Alice to coordinates 100 64 -200"

2. **Use raw commands**:
   ```
   Execute the command: give @p minecraft:diamond_sword 1
   ```

3. **Check supported intents** (see README.md)

4. **Include player names**:
   - "change gamemode" → "change Steve's gamemode to creative"

### Issue: Permission Errors

**Symptoms**: "Permission denied" when executing commands

**Solutions**:

1. **Check RCON password permissions**:
   - RCON password must match exactly
   - Check for whitespace in password

2. **File permissions**:
   ```bash
   chmod +r dist/mcp-server.js
   ```

3. **Node.js permissions**:
   - Ensure Node.js can execute the script
   - Try: `node dist/mcp-server.js` manually

### Issue: Commands Execute But Don't Work

**Symptoms**: Commands appear successful but nothing happens in-game

**Diagnosis**:
1. Check Minecraft server console for errors
2. Verify player name spelling
3. Check if player is online

**Solutions**:

1. **Player not online**:
   - Use `/list` to see online players
   - Use `@p` for nearest player instead of specific name

2. **Wrong syntax**:
   - Verify command syntax for your Minecraft version
   - Different versions have different command formats

3. **Insufficient permissions**:
   - RCON has admin permissions by default
   - Check server operator settings

### Issue: Server Becomes Unresponsive

**Symptoms**: Server stops responding to RCON commands

**Solutions**:

1. **Restart Minecraft server**:
   ```bash
   # In server console
   stop

   # Restart
   java -Xmx1024M -Xms1024M -jar server.jar nogui
   ```

2. **Check server resources**:
   ```bash
   # Linux/macOS
   top -p $(pgrep java)

   # Windows
   tasklist /FI "IMAGENAME eq java.exe"
   ```

3. **Review server logs**:
   ```bash
   tail -100 logs/latest.log
   ```

## Security Best Practices

### RCON Password Security

1. **Use Strong Passwords**:
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Generate: `openssl rand -base64 24`

2. **Never Commit Passwords**:
   - Don't commit `claude_desktop_config.json` to git
   - Don't share server.properties publicly
   - Use environment variables for sensitive values

3. **Rotate Passwords Regularly**:
   - Change RCON password every 90 days
   - Update both server.properties and Claude config

### Network Security

1. **Localhost Only** (Most Secure):
   ```properties
   # server.properties
   rcon.port=25575
   # No rcon.ip specified = binds to all interfaces
   # Use firewall to restrict to localhost
   ```

2. **Private Network** (Moderately Secure):
   - Only connect via LAN (192.168.x.x)
   - Never expose RCON port to internet

3. **Remote Access** (Use Tunnel):
   ```bash
   # SSH tunnel (recommended)
   ssh -L 25575:localhost:25575 user@server

   # Or VPN connection
   ```

### Access Control

1. **Limit RCON Commands**:
   - Enable safety validation (default)
   - Review logs regularly
   - Monitor server activity

2. **Audit Trail**:
   - Enable command logging in Minecraft
   - Review Claude Desktop logs
   - Track who executes commands when

3. **Principle of Least Privilege**:
   - Don't share RCON password unnecessarily
   - Use separate passwords for different admins
   - Revoke access when no longer needed

### Backup Strategy

Before using admin commands:

1. **Backup Server Files**:
   ```bash
   tar -czf minecraft-backup-$(date +%Y%m%d).tar.gz world/
   ```

2. **Backup Player Data**:
   ```bash
   cp -r world/playerdata/ backup/playerdata-$(date +%Y%m%d)/
   ```

3. **Test Restore Process**:
   - Verify backups are valid
   - Practice restoration
   - Document restoration steps

### Incident Response

If RCON is compromised:

1. **Immediate Actions**:
   - Change RCON password immediately
   - Restart Minecraft server
   - Review server logs for unauthorized commands

2. **Investigation**:
   - Check what commands were executed
   - Review player data for changes
   - Restore from backup if needed

3. **Prevention**:
   - Use stronger password
   - Enable additional logging
   - Review access controls

## Additional Resources

- [Minecraft Server Setup](https://minecraft.fandom.com/wiki/Tutorials/Setting_up_a_server)
- [RCON Protocol Specification](https://developer.valvesoftware.com/wiki/Source_RCON_Protocol)
- [Claude Desktop MCP Documentation](https://docs.claude.ai/mcp)
- [Minecraft Commands Reference](https://minecraft.fandom.com/wiki/Commands)

## Getting Help

- **GitHub Issues**: https://github.com/consigcody94/minecraft-pilot/issues
- **Discord**: [Join our community](#)
- **Email**: support@example.com

## Updates and Changelog

Subscribe to releases for updates:
- https://github.com/consigcody94/minecraft-pilot/releases

Enable GitHub notifications for this repository to get update alerts.

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
