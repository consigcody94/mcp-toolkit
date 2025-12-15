# 🎮 Minecraft Pilot

**Control your Minecraft server with natural language through Claude Desktop**

Minecraft Pilot is an MCP (Model Context Protocol) server that bridges Claude Desktop with Minecraft servers via RCON protocol. Ask Claude to give players items, teleport them, change game modes, set time/weather, and more - all using natural language.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Natural Language Control**: "Give Alice a diamond sword" → `/give Alice minecraft:diamond_sword 1`
- **RCON Protocol**: Direct server communication via Minecraft's Remote Console
- **12 Powerful Tools**: Complete server management from Claude Desktop
- **Intent Detection**: Smart parsing of natural language to Minecraft commands
- **Safety Validation**: Prevents dangerous operations (server stop, mass ban, etc.)
- **Reconnection Logic**: Automatic recovery from connection failures
- **Batch Operations**: Execute multiple commands in sequence
- **Rich Responses**: Beautiful markdown formatting with emojis and status indicators

## 🚀 Quick Start

### Prerequisites

- **Minecraft Server** (Java Edition) with RCON enabled
- **Claude Desktop** installed
- **Node.js** 16+ and npm

### 1. Install Minecraft Pilot

```bash
# Clone the repository
git clone https://github.com/consigcody94/minecraft-pilot.git
cd minecraft-pilot

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional, for easy access)
npm link
```

### 2. Enable RCON on Your Minecraft Server

Edit your `server.properties` file:

```properties
# Enable RCON
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password

# Optional: Change default port if needed
# rcon.port=25575
```

Restart your Minecraft server after making changes.

**Security Note**: RCON has no encryption. Only use on trusted networks or localhost. Never expose RCON ports to the public internet.

### 3. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "minecraft-pilot": {
      "command": "node",
      "args": ["/absolute/path/to/minecraft-pilot/dist/mcp-server.js"],
      "env": {
        "MINECRAFT_HOST": "localhost",
        "MINECRAFT_PORT": "25575",
        "MINECRAFT_PASSWORD": "your_secure_password"
      }
    }
  }
}
```

Replace `/absolute/path/to/minecraft-pilot` with the actual path to your installation.

### 4. Restart Claude Desktop

Restart Claude Desktop to load the MCP server. You should see minecraft-pilot tools available in the conversation.

## 💬 Usage Examples

### Natural Language Commands

Just talk to Claude naturally:

```
"Give Steve a diamond pickaxe"
→ /give Steve minecraft:diamond_pickaxe 1

"Teleport Alice to coordinates 100 64 -200"
→ /tp Alice 100 64 -200

"Set the time to day"
→ /time set 0

"Change Bob's gamemode to creative"
→ /gamemode creative Bob

"Make it rain"
→ /weather rain
```

### Direct Server Commands

You can also execute raw Minecraft commands:

```
"Execute the command: difficulty hard"
→ /difficulty hard

"Run: effect give @a minecraft:speed 60 2"
→ /effect give @a minecraft:speed 60 2
```

### Complex Workflows

Chain multiple operations:

```
"Connect to my Minecraft server at 192.168.1.100 with password 'test123',
then give all online players a diamond sword,
then set the time to noon"
```

## 🛠️ Available Tools

### 1. `connect_server`
Connect to a Minecraft server via RCON.

**Parameters**:
- `host` (string): Server hostname or IP address
- `port` (number): RCON port (default: 25575)
- `password` (string): RCON password
- `timeout` (number, optional): Connection timeout in milliseconds (default: 5000)

**Example**: `connect_server({ host: "localhost", port: 25575, password: "secret" })`

### 2. `execute_command`
Execute a raw Minecraft command.

**Parameters**:
- `command` (string): Minecraft command (without leading `/`)

**Example**: `execute_command({ command: "difficulty hard" })`

### 3. `natural_command`
Translate natural language to Minecraft command and execute.

**Parameters**:
- `prompt` (string): Natural language request

**Example**: `natural_command({ prompt: "give Steve a diamond sword" })`

**Supported Intents**:
- `give_item`: Give items to players
- `teleport`: Teleport players to coordinates or other players
- `change_gamemode`: Change player game modes
- `set_time`: Set world time (day/night/noon/midnight)
- `set_weather`: Change weather (clear/rain/thunder)
- `kill_entity`: Kill entities or players
- `summon_entity`: Summon mobs or entities
- `set_block`: Place blocks at coordinates
- `broadcast_message`: Send server-wide messages
- `kick_player`: Kick players from server
- `ban_player`: Ban players
- `op_player`: Give operator permissions
- `clear_inventory`: Clear player inventories
- `set_difficulty`: Change difficulty level

### 4. `list_players`
Get list of online players.

**No parameters required**

**Example**: `list_players()`

### 5. `give_item`
Give items to a player.

**Parameters**:
- `player` (string): Player name or selector (@p, @a, @r, @s)
- `item` (string): Item ID (e.g., "diamond_sword", "minecraft:stone")
- `amount` (number, optional): Quantity (default: 1)

**Example**: `give_item({ player: "Steve", item: "diamond_sword", amount: 1 })`

### 6. `teleport_player`
Teleport a player to coordinates or another player.

**Parameters**:
- `player` (string): Player to teleport
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `z` (number): Z coordinate

**OR**:
- `player` (string): Player to teleport
- `target` (string): Target player name or selector

**Example**: `teleport_player({ player: "Steve", x: 100, y: 64, z: -200 })`

### 7. `change_gamemode`
Change a player's game mode.

**Parameters**:
- `player` (string): Player name or selector
- `gamemode` (string): Game mode (survival, creative, adventure, spectator)

**Example**: `change_gamemode({ player: "Alice", gamemode: "creative" })`

### 8. `set_time`
Set the world time.

**Parameters**:
- `time` (number | string): Time value or preset (day=0, noon=6000, night=13000, midnight=18000)

**Example**: `set_time({ time: "day" })` or `set_time({ time: 6000 })`

### 9. `set_weather`
Change the weather.

**Parameters**:
- `weather` (string): Weather type (clear, rain, thunder)

**Example**: `set_weather({ weather: "rain" })`

### 10. `broadcast_message`
Send a message to all players.

**Parameters**:
- `message` (string): Message text

**Example**: `broadcast_message({ message: "Server restart in 5 minutes!" })`

### 11. `kick_player`
Kick a player from the server.

**Parameters**:
- `player` (string): Player name
- `reason` (string, optional): Kick reason (default: "Kicked by admin")

**Example**: `kick_player({ player: "Griefer123", reason: "Rule violation" })`

### 12. `summon_entity`
Summon a mob or entity.

**Parameters**:
- `entity` (string): Entity type (e.g., "pig", "zombie", "ender_dragon")
- `x` (number, optional): X coordinate
- `y` (number, optional): Y coordinate
- `z` (number, optional): Z coordinate

**Example**: `summon_entity({ entity: "pig", x: 100, y: 64, z: -200 })`

## 🛡️ Safety Features

Minecraft Pilot includes built-in safety validation to prevent dangerous operations:

### Blocked Commands

The following command patterns are automatically blocked:

- `stop` - Server shutdown
- `restart` - Server restart
- `whitelist off` - Disabling whitelist
- `op *` - Giving operator to everyone
- `ban *` - Banning everyone
- `kill @a` / `kill @e` - Killing all players/entities

### Safety Validation

Before executing any command, Minecraft Pilot:

1. **Validates Syntax**: Ensures commands are properly formed
2. **Checks Patterns**: Scans for dangerous operation patterns
3. **Confirms Intent**: For destructive actions, asks for confirmation
4. **Limits Scope**: Prevents mass operations without explicit approval

You can disable validation by setting `validate: false` in command requests (use with caution).

## 🏗️ Architecture

### Project Structure

```
minecraft-pilot/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── rcon/
│   │   └── rcon-client.ts    # RCON client wrapper
│   ├── parsers/
│   │   └── command-parser.ts # Natural language parser
│   ├── mcp-server.ts         # MCP server implementation
│   └── index.ts              # Public API exports
├── dist/                     # Compiled JavaScript
├── tests/                    # Jest tests
├── package.json
├── tsconfig.json
└── README.md
```

### Component Overview

#### RCON Client (`rcon-client.ts`)

Wraps the `rcon-client` npm package with enhanced features:

- **Automatic Reconnection**: Up to 3 retry attempts on connection loss
- **Error Handling**: Graceful error recovery with detailed error messages
- **Event Management**: Connection lifecycle event handlers
- **Batch Execution**: Execute multiple commands sequentially
- **Timeout Control**: Configurable command timeouts

#### Command Parser (`command-parser.ts`)

Intelligent natural language processing:

- **Intent Detection**: Regex-based pattern matching for 13 command types
- **Entity Extraction**: Automatically extracts players, items, coordinates, modes, etc.
- **Command Generation**: Converts parsed intent into valid Minecraft commands
- **Confidence Scoring**: Returns confidence level for detected intents

#### MCP Server (`mcp-server.ts`)

Model Context Protocol implementation:

- **JSON-RPC 2.0**: Standard protocol for Claude Desktop integration
- **12 MCP Tools**: Complete Minecraft server management toolkit
- **Markdown Responses**: Beautiful formatted output with syntax highlighting
- **Connection Management**: Persistent RCON connection with health checks
- **Error Recovery**: Automatic reconnection on failures

## 🔧 Development

### Setup Development Environment

```bash
# Clone and install
git clone https://github.com/consigcody94/minecraft-pilot.git
cd minecraft-pilot
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing with a Local Minecraft Server

1. **Install Minecraft Server**: Download from [minecraft.net](https://www.minecraft.net/en-us/download/server)

2. **Configure RCON**: Edit `server.properties`:
   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=testing123
   ```

3. **Start Server**: Run `java -Xmx1024M -Xms1024M -jar server.jar nogui`

4. **Test Connection**:
   ```bash
   node dist/mcp-server.js
   ```

### Manual RCON Testing

Test RCON directly using `mcrcon` tool:

```bash
# Install mcrcon
npm install -g mcrcon

# Test connection
mcrcon -H localhost -P 25575 -p your_password "list"
```

## 🐛 Troubleshooting

### "Failed to connect to RCON" Error

**Cause**: Cannot establish connection to Minecraft server.

**Solutions**:
1. Verify RCON is enabled in `server.properties`
2. Check host/port/password are correct
3. Ensure Minecraft server is running
4. Check firewall rules (RCON port must be open)
5. Try `localhost` instead of `127.0.0.1` or vice versa

### "Connection timeout" Errors

**Cause**: RCON requests taking too long.

**Solutions**:
1. Increase timeout value: `connect_server({ ..., timeout: 10000 })`
2. Check server performance (TPS drops affect RCON)
3. Reduce query frequency
4. Check network latency

### "Command validation failed" Errors

**Cause**: Safety validator blocked a dangerous command.

**Solutions**:
1. Review the command for dangerous patterns
2. Use more specific selectors instead of `@a` or `@e`
3. If intentional, disable validation: `execute_command({ command: "...", validate: false })`

### Tools Not Showing in Claude Desktop

**Cause**: Claude Desktop hasn't loaded the MCP server.

**Solutions**:
1. Check `claude_desktop_config.json` path is correct
2. Verify absolute path to `mcp-server.js` is correct
3. Restart Claude Desktop completely (quit and reopen)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### "Permission denied" on Unix Socket

**Cause**: User lacks permission to access RCON socket.

**Solutions**:
1. Run Minecraft server as your user (not root)
2. Check file permissions on server directory
3. Use TCP instead of Unix sockets (RCON is TCP by default)

### Natural Language Not Understood

**Cause**: Command parser couldn't detect intent.

**Solutions**:
1. Use more explicit phrasing: "give Steve diamond sword" → "give Steve a diamond sword"
2. Include context: "set time" → "set time to day"
3. Use raw commands instead: `execute_command({ command: "..." })`
4. Check supported intents in documentation

## 📚 Resources

- [Minecraft Server Setup Guide](https://minecraft.fandom.com/wiki/Tutorials/Setting_up_a_server)
- [RCON Protocol Specification](https://developer.valvesoftware.com/wiki/Source_RCON_Protocol)
- [Minecraft Commands Reference](https://minecraft.fandom.com/wiki/Commands)
- [Model Context Protocol](https://github.com/anthropics/mcp)
- [Claude Desktop](https://claude.ai/download)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Feature Requests

Have ideas for new features? Open an issue with the `enhancement` label!

**Potential features**:
- Support for additional Minecraft commands
- Command macros and shortcuts
- Multi-server management
- Scheduled commands
- Player activity monitoring
- Server performance metrics
- Integration with Minecraft server APIs
- Support for Bedrock Edition

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [rcon-client](https://github.com/janispritzkau/rcon-client) by Janis Pritzkau
- Powered by [Model Context Protocol](https://github.com/anthropics/mcp)
- Inspired by the Minecraft community

## ⚠️ Disclaimer

Minecraft Pilot is an unofficial third-party tool and is not affiliated with, endorsed by, or associated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios.

Use at your own risk. Always backup your Minecraft server before using admin commands.

---

**Made with ❤️ for the Minecraft community**

