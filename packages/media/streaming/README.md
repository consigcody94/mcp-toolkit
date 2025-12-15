# Stream Pilot 🎥

**Powerful MCP server for controlling OBS Studio and Twitch through natural language**

Control your streaming setup with AI assistance through Claude Desktop. Manage scenes, start/stop streams, update Twitch metadata, create clips, and monitor performance - all through conversational commands.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)

## Features

### OBS Studio Control 🎬

- **Connection Management**: Connect to OBS Studio via WebSocket
- **Scene Control**: List, view, and switch between scenes
- **Streaming**: Start/stop streams with real-time status monitoring
- **Recording**: Start/stop recordings with duration and file size tracking
- **Source Management**: Show/hide sources in the current scene
- **Performance Stats**: Monitor CPU, memory, FPS, and frame statistics

### Twitch Integration 📺

- **User Information**: Get detailed user profiles and statistics
- **Stream Status**: Check live stream information and viewer counts
- **Channel Management**: Update stream titles, games, and language
- **Clip Creation**: Create and retrieve clips from live streams
- **Category Search**: Find games and categories for your stream
- **Discovery**: Browse top streams and trending content

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **OBS Studio** 28+ with WebSocket server enabled
- **Twitch Account** (for Twitch features)
- **Claude Desktop** (for MCP integration)

### Setup OBS Studio

1. **Install OBS Studio** (v28 or later)
2. **Enable WebSocket Server**:
   - Open OBS Studio
   - Go to **Tools** → **WebSocket Server Settings**
   - Check "Enable WebSocket server"
   - Set a password (optional but recommended)
   - Note the port (default: 4455)
   - Click "Apply" and "OK"

### Setup Twitch API

1. **Create Twitch Application**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
   - Click "Register Your Application"
   - Name: "Stream Pilot" (or any name)
   - OAuth Redirect URLs: `http://localhost`
   - Category: Broadcasting Suite
   - Click "Create"

2. **Get Credentials**:
   - Copy your **Client ID**
   - Click "New Secret" to get **Client Secret**
   - Generate an OAuth token at [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Scopes needed: `channel:manage:broadcast`, `clips:edit`, `user:read:email`

### Install Stream Pilot

```bash
# Clone the repository
git clone https://github.com/consigcody94/stream-pilot.git
cd stream-pilot

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional, for easier access)
npm link
```

### Configure Claude Desktop

Add Stream Pilot to your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "stream-pilot": {
      "command": "node",
      "args": ["/absolute/path/to/stream-pilot/dist/index.js"],
      "env": {
        "OBS_HOST": "localhost",
        "OBS_PORT": "4455",
        "OBS_PASSWORD": "your-obs-password",
        "TWITCH_CLIENT_ID": "your-client-id",
        "TWITCH_CLIENT_SECRET": "your-client-secret",
        "TWITCH_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

**Restart Claude Desktop** after configuration.

## Usage

Once configured, you can control OBS and Twitch through natural language in Claude Desktop.

### OBS Examples

**Connect to OBS**:
```
Connect to my OBS Studio
```

**Manage Scenes**:
```
What scenes do I have available?
Switch to the Gaming scene
What's my current scene?
```

**Streaming Control**:
```
Start streaming
What's my stream status?
Stop the stream
```

**Recording Control**:
```
Start recording
Check recording status
Stop recording
```

**Source Management**:
```
Show me all my sources
Hide the webcam source
Make the overlay visible
```

**Performance Monitoring**:
```
Show OBS performance stats
How's my CPU and FPS?
```

### Twitch Examples

**Setup** (first time):
```
Setup my Twitch credentials
```

**User Information**:
```
Get my Twitch user info
Look up information for username summit1g
```

**Stream Status**:
```
Is DrLupo live right now?
Show me stream info for pokimane
```

**Channel Management**:
```
Update my stream title to "Speedrunning Portal 2 - World Record Attempts"
Change my game to Minecraft
Set my stream language to English
```

**Clips**:
```
Create a clip of my stream
Show me my recent clips
Get the last 10 clips
```

**Discovery**:
```
Search for Just Chatting category
Show me top streams
What are the top Valorant streams?
```

## MCP Tools Reference

### OBS Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `connect_obs` | Connect to OBS Studio | `host`, `port`, `password` |
| `list_scenes` | List all available scenes | None |
| `get_current_scene` | Get currently active scene | None |
| `switch_scene` | Switch to a different scene | `sceneName` |
| `start_stream` | Start streaming | None |
| `stop_stream` | Stop streaming | None |
| `get_stream_status` | Get streaming status/stats | None |
| `start_recording` | Start recording | None |
| `stop_recording` | Stop recording | None |
| `get_record_status` | Get recording status/stats | None |
| `list_sources` | List all available sources | None |
| `set_source_visibility` | Show/hide a source | `sourceName`, `visible` |
| `get_obs_stats` | Get performance statistics | None |

### Twitch Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `setup_twitch` | Configure Twitch credentials | `clientId`, `clientSecret`, `accessToken` |
| `get_user` | Get user information | `login` (optional) |
| `get_stream_info` | Get live stream info | `userLogin` |
| `update_channel` | Update channel metadata | `broadcasterId`, `title`, `gameId`, `language` |
| `create_clip` | Create a clip | `broadcasterId` |
| `get_clips` | Get recent clips | `broadcasterId`, `first` |
| `search_categories` | Search games/categories | `query` |
| `get_top_streams` | Get top live streams | `gameId`, `first` |

## Architecture

```
stream-pilot/
├── src/
│   ├── obs-client.ts       # OBS WebSocket client wrapper
│   ├── twitch-client.ts    # Twitch Helix API client wrapper
│   ├── mcp-server.ts       # MCP protocol server (21 tools)
│   ├── types.ts            # TypeScript type definitions
│   └── index.ts            # Entry point and exports
├── package.json            # Project metadata and dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

### Technology Stack

- **TypeScript 5.3**: Strict type safety
- **obs-websocket-js**: OBS WebSocket protocol client
- **axios**: HTTP client for Twitch API
- **Model Context Protocol**: JSON-RPC 2.0 over stdin/stdout

## Development

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Watch Mode

```bash
npm run dev
```

## Troubleshooting

### OBS Connection Issues

**Problem**: "Failed to connect to OBS"

**Solutions**:
- Verify OBS Studio is running
- Check WebSocket server is enabled (Tools → WebSocket Server Settings)
- Confirm port matches configuration (default: 4455)
- Verify password is correct
- Check firewall allows WebSocket connections

### Twitch API Issues

**Problem**: "Twitch client not configured"

**Solutions**:
- Run `setup_twitch` tool first with credentials
- Verify Client ID and Access Token are correct
- Regenerate access token if expired (tokens expire after 60 days)
- Check OAuth scopes include `channel:manage:broadcast` and `clips:edit`

**Problem**: "Failed to update channel"

**Solutions**:
- Verify broadcaster ID matches your user ID
- Ensure access token has required scopes
- Check you're using the correct game ID (use `search_categories` to find it)

### Claude Desktop Integration

**Problem**: "stream-pilot tools not showing in Claude"

**Solutions**:
- Restart Claude Desktop after configuration changes
- Verify config file path is correct for your OS
- Check absolute path to `dist/index.js` is correct
- Ensure project is built (`npm run build`)
- View Claude Desktop logs for errors

**Problem**: "Command not found" errors

**Solutions**:
- Verify Node.js 18+ is installed (`node --version`)
- Use full path to node executable in config
- Check file permissions on `dist/index.js`

## Security Notes

- **Never commit** credentials to version control
- Store tokens in environment variables or secure vaults
- Use `.env` files (excluded via `.gitignore`) for local development
- Regenerate access tokens if they're ever exposed
- OBS WebSocket passwords should be strong and unique

## Roadmap

- [ ] Advanced scene transitions with custom durations
- [ ] Twitch chat bot integration
- [ ] EventSub webhooks for real-time events
- [ ] Multi-platform support (YouTube, Facebook Gaming)
- [ ] Stream analytics and viewer insights
- [ ] Automated highlight detection and clip creation
- [ ] Plugin/filter control in OBS
- [ ] Streamlabs/StreamElements integration
- [ ] Web dashboard for monitoring

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OBS Studio](https://obsproject.com/) - Open source streaming and recording software
- [obs-websocket-js](https://github.com/obs-websocket-community-projects/obs-websocket-js) - WebSocket client library
- [Twitch Developers](https://dev.twitch.tv/) - Twitch Helix API
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

## Support

- **Issues**: [GitHub Issues](https://github.com/consigcody94/stream-pilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/consigcody94/stream-pilot/discussions)
- **Email**: consigcody94@gmail.com

---

**Made with ❤️ for streamers and content creators**
