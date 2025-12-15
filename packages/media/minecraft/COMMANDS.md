# Minecraft Server Commands Guide

## Common Commands via MCP

### Player Management

```plaintext
# List all online players
"Show me all online players"

# Give items to players
"Give Steve a diamond sword"
"Give Alex 64 iron ingots"

# Teleport players
"Teleport Steve to coordinates 100 64 200"
"Teleport Steve to Alex"

# Change gamemode
"Set Steve's gamemode to creative"
"Set all players to survival mode"

# Kick players
"Kick Steve for spamming"
```

### World Management

```plaintext
# Set time
"Set time to day"
"Set time to midnight"
"Set time to 6000"

# Set weather
"Make it sunny"
"Start a thunderstorm"
"Clear the weather"

# Summon entities
"Summon a wither at coordinates 0 64 0"
"Summon 10 zombies near Steve"
```

### Server Management

```plaintext
# Broadcast messages
"Tell all players: Server restarting in 5 minutes"
"Broadcast: Weekly event starts now!"

# Execute custom commands
"Execute command: /whitelist add NewPlayer"
"Run: /difficulty hard"
```

## Direct RCON Commands

### Essentials

```bash
# List players
/list

# Give items
/give <player> <item> [amount]
/give Steve minecraft:diamond 64

# Teleport
/tp <player> <destination>
/tp Steve Alex
/tp Steve 100 64 200

# Gamemode
/gamemode <mode> [player]
/gamemode creative Steve
/gamemode survival @a

# Time & Weather
/time set <value>
/weather <type> [duration]
```

### Administration

```bash
# Whitelist
/whitelist add <player>
/whitelist remove <player>
/whitelist list

# Bans
/ban <player> [reason]
/pardon <player>
/ban-ip <address>

# Ops
/op <player>
/deop <player>

# Server
/save-all
/save-off
/save-on
/stop
```

## Safety Features

The MCP server blocks dangerous commands:
- `/stop` - Use server management tools instead
- `/restart`
- `/whitelist off`
- Mass `/kill` or `/ban`

## Examples with MCP

Natural language examples:

```plaintext
# Morning routine
"Set time to day and clear weather"

# Welcome new player
"Tell all players: Welcome NewPlayer to the server!"
"Give NewPlayer a wooden sword and 32 bread"

# Event setup
"Teleport all players to coordinates 0 100 0"
"Set everyone's gamemode to adventure"

# Cleanup
"Clear all dropped items"
"Set weather to clear"
```

## Configuration

RCON setup in `server.properties`:

```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

Then in Claude Desktop MCP config:

```json
{
  "minecraft-pilot": {
    "command": "minecraft-pilot",
    "env": {
      "MINECRAFT_HOST": "localhost",
      "MINECRAFT_PORT": "25575",
      "MINECRAFT_PASSWORD": "your_secure_password"
    }
  }
}
```
