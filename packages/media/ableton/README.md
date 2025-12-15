# 🎵 studio-pilot

> Control Ableton Live with natural language through Claude Desktop - MCP server for music production

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

**studio-pilot** brings the power of AI to music production. Control Ableton Live using natural language through Claude Desktop, making music creation more intuitive and accessible than ever before.

## 🎯 Why studio-pilot?

Music production software is incredibly powerful but has a steep learning curve. **studio-pilot** bridges this gap by letting you:

- 🗣️ **Control with voice** - "Set tempo to 120 BPM and create a MIDI track called 'Bass'"
- 🤖 **AI-assisted workflow** - Let Claude help you set up your session, create tracks, and manage your mix
- 📚 **Learn as you go** - Claude explains what each operation does, helping you master Ableton Live
- ⚡ **Rapid prototyping** - Quickly set up complex sessions through conversation
- 🎓 **Lower barrier to entry** - Perfect for beginners and experienced producers alike

## ✨ Features

### 🎛️ Session Control
- Get session information (tempo, time signature, playing status)
- Set tempo (20-999 BPM)
- Transport control (play, pause, stop, continue)

### 🎹 Track Management
- Create audio and MIDI tracks
- Position tracks at specific locations
- Automatic track naming

### 🎼 Clip Creation
- Create MIDI clips in any track and scene
- Set clip length in bars
- Custom clip naming

### 🎚️ Mixer Operations
- Control volume, pan, mute, solo
- Batch parameter changes
- Real-time track level monitoring

### 🔊 Real-time Monitoring
- Get output meter levels for any track
- Monitor multiple tracks simultaneously
- Visual level indicators in responses

## 🚀 Installation

### Prerequisites

1. **Ableton Live 10 or later** with OSC support enabled
2. **Node.js 16+** installed
3. **Claude Desktop** (or any MCP-compatible LLM client)

### From Source

```bash
git clone https://github.com/consigcody94/studio-pilot
cd studio-pilot
npm install
npm run build
npm link
```

Now you can use `studio-pilot` from anywhere!

## 🎛️ Ableton Live Configuration

Before using studio-pilot, you need to enable OSC support in Ableton Live:

### For Ableton Live 10+

1. Download and install **LiveOSC** or **AbletonOSC**:
   - LiveOSC: https://github.com/ideoforms/LiveOSC
   - AbletonOSC (recommended): https://github.com/ideoforms/AbletonOSC

2. Place the downloaded files in your Ableton Live MIDI Remote Scripts folder:
   - **macOS**: `~/Music/Ableton/User Library/Remote Scripts/`
   - **Windows**: `%USERPROFILE%\\Documents\\Ableton\\User Library\\Remote Scripts\\`
   - **Linux**: `~/Ableton/User Library/Remote Scripts/`

3. Launch Ableton Live and go to **Preferences → Link/Tempo/MIDI**

4. In the MIDI Ports section, enable **Remote** for the OSC script

5. The OSC server should now be running on ports 11000 (send) and 11001 (receive)

### Verify OSC is Working

You can verify OSC is working by checking Ableton's logs or using an OSC testing tool like [OSCulator](https://osculator.net/).

## 📖 MCP Setup (Claude Desktop)

1. **Install studio-pilot** (see installation steps above)

2. **Configure Claude Desktop**

   Edit your Claude Desktop configuration file:

   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

3. **Add studio-pilot to MCP servers:**

   ```json
   {
     "mcpServers": {
       "studio-pilot": {
         "command": "studio-pilot",
         "args": [],
         "env": {
           "ABLETON_HOST": "localhost",
           "ABLETON_SEND_PORT": "11000",
           "ABLETON_RECEIVE_PORT": "11001"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

5. **Test it!** Try asking Claude: "What's my current tempo in Ableton?"

For detailed setup instructions and troubleshooting, see [MCP_SETUP.md](MCP_SETUP.md).

## 🎬 Usage Examples

Once configured, you can ask Claude to control Ableton Live using natural language:

### Getting Started

> **You:** "What's my current Ableton session setup?"

Claude will use the `get_session_info` tool to show you the current tempo, time signature, and playing status.

### Setting Up a Session

> **You:** "Set the tempo to 95 BPM and create three tracks: one MIDI track for drums, one MIDI track for bass, and one audio track for vocals"

Claude will:
1. Set the tempo to 95 BPM
2. Create a MIDI track named "drums"
3. Create a MIDI track named "bass"
4. Create an audio track named "vocals"

### Creating a Beat

> **You:** "Create a 4-bar MIDI clip in track 0, scene 0 called 'Drum Pattern'"

Claude will create the clip and confirm its creation.

### Mixing

> **You:** "Set track 1 volume to 80%, pan it 30% to the right, and unmute it"

Claude will adjust the mixer parameters for track 1 as requested.

### Transport Control

> **You:** "Start playback"

Claude will start playing your Ableton Live session.

> **You:** "Stop playback and reset to the beginning"

Claude will stop and reset the transport.

### Monitoring Levels

> **You:** "Show me the output levels for tracks 0, 1, and 2"

Claude will display a visual representation of the current output levels for those tracks.

## 🎼 Complete Example Workflow

Here's a complete conversation showing how to set up a simple lo-fi hip-hop beat:

```
You: Help me start a lo-fi hip-hop beat

Claude: I'll help you set up a lo-fi session! Let me:
1. Set a chill tempo (85 BPM is perfect for lo-fi)
2. Create the basic tracks we'll need

[Uses set_tempo and create_track tools]

✓ Tempo set to 85 BPM
🎹 Created midi track "Lo-Fi Drums" at position 0
🎹 Created midi track "Bass" at position 1
🎹 Created midi track "Piano/Keys" at position 2
🎹 Created midi track "Vinyl Texture" at position 3
🎵 Created audio track "Vocals/Samples" at position 4

Your lo-fi session is ready! The tracks are set up with a classic
lo-fi tempo. Want me to create some initial clips?

You: Yes, create 8-bar clips in the first scene for drums, bass, and piano

Claude: [Creates clips]

🎼 Created clip "Lo-Fi Drums" in track 0, scene 0 (8 bars)
🎼 Created clip "Bass Line" in track 1, scene 0 (8 bars)
🎼 Created clip "Piano Chords" in track 2, scene 0 (8 bars)

Your clips are ready to fill with music! Start playback when you're ready.

You: Set the drums to 80% volume, bass to 70%, and piano to 60%

Claude: [Adjusts mixer]

🎚️ Track 0 mixer updated:
  • volume: 80%
🎚️ Track 1 mixer updated:
  • volume: 70%
🎚️ Track 2 mixer updated:
  • volume: 60%

Perfect lo-fi mix levels! Your drums will punch through while the
bass and piano sit nicely in the background.

You: Start playback

Claude: ▶️ Playback started playing

Happy creating! 🎵
```

## 🛠️ Available MCP Tools

### `get_session_info`
Get current Ableton Live session information.

**Parameters:** None

**Example:** "What's my current tempo?"

### `set_tempo`
Set the tempo (BPM) of the session.

**Parameters:**
- `tempo` (number, required): BPM between 20 and 999

**Example:** "Set tempo to 128 BPM"

### `transport_control`
Control playback transport.

**Parameters:**
- `action` (string, required): "play", "pause", "stop", or "continue"

**Example:** "Stop playback"

### `create_track`
Create a new audio or MIDI track.

**Parameters:**
- `name` (string, required): Track name
- `type` (string, required): "audio" or "midi"
- `position` (number, optional): Track position (0-based)

**Example:** "Create a MIDI track called Synth Lead"

### `create_clip`
Create a new MIDI clip.

**Parameters:**
- `trackId` (number, required): Track index (0-based)
- `sceneIndex` (number, required): Scene index (0-based)
- `name` (string, optional): Clip name
- `length` (number, optional): Length in bars (default: 4)

**Example:** "Create a 16-bar clip in track 2, scene 0"

### `set_mixer`
Set mixer parameters for a track.

**Parameters:**
- `trackId` (number, required): Track index (0-based)
- `volume` (number, optional): 0-1 (default: 0.85)
- `pan` (number, optional): -1 (left) to 1 (right)
- `mute` (boolean, optional): Mute state
- `solo` (boolean, optional): Solo state

**Example:** "Mute track 3 and set its volume to 50%"

### `get_track_levels`
Get real-time output meter levels for tracks.

**Parameters:**
- `trackIds` (array of numbers, required): Track indices to monitor

**Example:** "Show me levels for tracks 0, 1, and 2"

## 🏗️ Architecture

```
studio-pilot/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── osc-client.ts          # OSC communication with Ableton Live
│   ├── mcp-server.ts          # MCP protocol server
│   └── index.ts               # Public API exports
├── dist/                      # Compiled JavaScript output
├── tests/                     # Test suite
└── docs/                      # Additional documentation
```

### How It Works

1. **MCP Layer**: Claude Desktop communicates with studio-pilot via the Model Context Protocol (JSON-RPC 2.0 over stdin/stdout)

2. **Translation Layer**: studio-pilot translates MCP tool calls into OSC messages

3. **OSC Layer**: OSC messages are sent to Ableton Live on port 11000, responses come back on port 11001

4. **Ableton Live**: Executes the commands and sends back status information

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode with watch
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Build for production
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 💡 Tips & Best Practices

### Naming Conventions

Use descriptive track names that Claude can understand:
- ✅ "Create a MIDI track called 'Drum Kit'"
- ✅ "Create an audio track for 'Lead Vocals'"
- ❌ "Create track trk_001"

### Session Organization

Organize your requests logically:
1. Set tempo and time signature first
2. Create all your tracks
3. Create clips in a scene
4. Adjust mixer settings
5. Start playback

### Working with Clips

Remember that:
- Scene index 0 is the top scene
- Track index 0 is the leftmost track
- Clip length is in bars (not beats)

### Monitoring Performance

- Use `get_track_levels` to monitor your mix in real-time
- Check levels regularly to avoid clipping
- Claude can help you identify problem tracks

## ❓ FAQ

**Q: Does this work with Ableton Live Lite?**
A: Yes, as long as you can install the OSC remote script, it works with all versions of Ableton Live 10+.

**Q: Can I use this with FL Studio or Logic Pro?**
A: Currently studio-pilot only supports Ableton Live via OSC. Support for other DAWs may come in future versions.

**Q: Do I need to keep Claude Desktop open?**
A: Yes, Claude Desktop (or another MCP client) is required to translate your natural language requests into tool calls.

**Q: Can I control plugins and effects?**
A: Basic plugin parameter control is planned for future versions. Currently, you can create tracks and clips, and control mixer parameters.

**Q: Is there a lag between commands?**
A: OSC communication is very fast (<10ms typical). The main latency is from LLM response time (1-3 seconds).

**Q: Can multiple instances run simultaneously?**
A: Currently, only one studio-pilot instance can connect to Ableton Live at a time due to OSC port limitations.

## 🗺️ Roadmap

- [ ] Plugin and device control
- [ ] MIDI note editing
- [ ] Automation recording and editing
- [ ] Project file management
- [ ] Multi-DAW support (FL Studio, Logic Pro)
- [ ] Web UI for direct browser control
- [ ] Voice input support
- [ ] AI-powered mixing suggestions
- [ ] Template management
- [ ] Collaboration features

## 📄 License

MIT © [consigcody94](https://github.com/consigcody94)

## 🙏 Acknowledgments

- Built with [node-osc](https://github.com/MylesBorins/node-osc) for OSC communication
- Powered by [Model Context Protocol](https://modelcontextprotocol.io)
- Inspired by the music production community

## 🎵 Made with studio-pilot

Are you using studio-pilot in your music production workflow? Let us know! We'd love to feature your tracks and workflows.

## 🔗 Links

- [GitHub Repository](https://github.com/consigcody94/studio-pilot)
- [Issue Tracker](https://github.com/consigcody94/studio-pilot/issues)
- [MCP Setup Guide](MCP_SETUP.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Ableton Live](https://www.ableton.com/)

---

**⭐ Star this repo if you find it useful!**

Made with ❤️ by [consigcody94](https://github.com/consigcody94)
