# MCP (Model Context Protocol) Setup Guide

Complete guide to setting up studio-pilot with Claude Desktop and other MCP-compatible LLM clients.

## What is MCP?

MCP (Model Context Protocol) is a protocol that allows LLMs like Claude to use external tools directly. With studio-pilot's MCP server, Claude can control Ableton Live, making music production accessible through natural language.

## Prerequisites

Before setting up MCP, ensure you have:

1. ✅ **Ableton Live 10+** installed with OSC support configured
2. ✅ **Node.js 16+** installed
3. ✅ **Claude Desktop** (or another MCP-compatible client)
4. ✅ **studio-pilot** installed globally

## Installation Steps

### 1. Install studio-pilot

```bash
# Clone the repository
git clone https://github.com/consigcody94/studio-pilot
cd studio-pilot

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

Verify installation:
```bash
studio-pilot --version
```

### 2. Configure Ableton Live for OSC

#### Install AbletonOSC (Recommended)

1. Download **AbletonOSC** from https://github.com/ideoforms/AbletonOSC

2. Locate your Ableton Remote Scripts folder:
   - **macOS**: `~/Music/Ableton/User Library/Remote Scripts/`
   - **Windows**: `%USERPROFILE%\\Documents\\Ableton\\User Library\\Remote Scripts\\`
   - **Linux**: `~/Ableton/User Library/Remote Scripts/`

3. Extract the AbletonOSC folder into Remote Scripts

4. Launch Ableton Live

5. Go to **Preferences → Link/Tempo/MIDI**

6. In the Control Surface dropdown, select **AbletonOSC**

7. Set Input and Output to **None**

8. Enable **Remote** checkbox for the OSC ports

#### Verify OSC is Running

Open Ableton's Log.txt file to verify OSC started:

- **macOS**: `~/Library/Preferences/Ableton/Live X.X/Log.txt`
- **Windows**: `%APPDATA%\\Ableton\\Live X.X\\Preferences\\Log.txt`
- **Linux**: `~/.config/Ableton/Live X.X/Preferences/Log.txt`

Look for lines like:
```
AbletonOSC: Listening on port 11000
AbletonOSC: Sending to port 11001
```

### 3. Configure Claude Desktop

#### macOS

1. Locate the Claude Desktop config file:
   ```bash
   open ~/Library/Application\ Support/Claude/
   ```

2. Edit or create `claude_desktop_config.json`:
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

#### Linux

1. Locate the Claude Desktop config file:
   ```bash
   mkdir -p ~/.config/Claude
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. Add the same configuration as above

#### Windows

1. Locate the Claude Desktop config file:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Edit with Notepad and add the same configuration as above

### 4. Restart Claude Desktop

Completely quit Claude Desktop (not just close the window) and relaunch it.

## Testing Your Setup

Once everything is configured, test the connection:

### Test 1: Check Tools Available

In Claude Desktop, type:
> "What MCP tools do you have available?"

Claude should list studio-pilot tools including:
- get_session_info
- set_tempo
- transport_control
- create_track
- create_clip
- set_mixer
- get_track_levels

### Test 2: Get Session Info

With Ableton Live running, ask:
> "What's my current Ableton session setup?"

Claude should respond with your current tempo, time signature, and playing status.

### Test 3: Control Transport

Try:
> "Start playback in Ableton"

Ableton Live should start playing (if you have any clips).

## Advanced Configuration

### Custom OSC Ports

If you're using non-standard OSC ports, update your configuration:

```json
{
  "mcpServers": {
    "studio-pilot": {
      "command": "studio-pilot",
      "args": [],
      "env": {
        "ABLETON_HOST": "localhost",
        "ABLETON_SEND_PORT": "12000",
        "ABLETON_RECEIVE_PORT": "12001"
      }
    }
  }
}
```

And configure Ableton's OSC script to use the same ports.

### Remote Ableton Instance

To control Ableton Live running on another machine:

```json
{
  "mcpServers": {
    "studio-pilot": {
      "command": "studio-pilot",
      "args": [],
      "env": {
        "ABLETON_HOST": "192.168.1.100",
        "ABLETON_SEND_PORT": "11000",
        "ABLETON_RECEIVE_PORT": "11001"
      }
    }
  }
}
```

**Note**: Make sure firewall rules allow OSC traffic on both machines.

### Multiple Ableton Instances

You can configure multiple studio-pilot instances for different Ableton Live sessions:

```json
{
  "mcpServers": {
    "studio-pilot-main": {
      "command": "studio-pilot",
      "args": [],
      "env": {
        "ABLETON_HOST": "localhost",
        "ABLETON_SEND_PORT": "11000",
        "ABLETON_RECEIVE_PORT": "11001"
      }
    },
    "studio-pilot-laptop": {
      "command": "studio-pilot",
      "args": [],
      "env": {
        "ABLETON_HOST": "192.168.1.50",
        "ABLETON_SEND_PORT": "11000",
        "ABLETON_RECEIVE_PORT": "11001"
      }
    }
  }
}
```

Now you can ask Claude:
> "Use studio-pilot-main to set tempo to 120"
> "Use studio-pilot-laptop to create a MIDI track"

## Troubleshooting

### "Command not found: studio-pilot"

**Problem**: The studio-pilot command isn't in your PATH.

**Solutions**:

1. Use the full path to the built mcp-server:
   ```json
   {
     "command": "node",
     "args": ["/full/path/to/studio-pilot/dist/mcp-server.js"]
   }
   ```

2. Or verify npm global bin is in your PATH:
   ```bash
   npm config get prefix
   # Add <prefix>/bin to your PATH
   ```

3. Re-run `npm link`:
   ```bash
   cd /path/to/studio-pilot
   npm link
   ```

### "Cannot connect to Ableton Live"

**Problem**: OSC connection fails.

**Solutions**:

1. **Verify Ableton Live is running** with a project open

2. **Check OSC is enabled**:
   - Go to Ableton Preferences → Link/Tempo/MIDI
   - Verify AbletonOSC is selected as Control Surface
   - Remote checkbox should be enabled

3. **Check ports aren't blocked**:
   ```bash
   # macOS/Linux
   lsof -i :11000
   lsof -i :11001

   # Windows
   netstat -ano | findstr :11000
   netstat -ano | findstr :11001
   ```

4. **Check Ableton's log file** for OSC errors

5. **Restart Ableton Live** and Claude Desktop

### "Tools not showing in Claude Desktop"

**Problem**: Claude Desktop doesn't see studio-pilot tools.

**Solutions**:

1. **Verify JSON syntax** in config file:
   - Use a JSON validator
   - Check for missing commas, brackets
   - Ensure proper quote escaping on Windows

2. **Check Claude Desktop logs**:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\\Claude\\logs\\`
   - Linux: `~/.config/Claude/logs/`

3. **Completely restart Claude Desktop**:
   - Quit application (Cmd+Q on macOS, not just close window)
   - Kill any background processes
   - Relaunch

4. **Test the MCP server directly**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | studio-pilot
   ```
   Should return initialization response

### "Error: OSC response timeout"

**Problem**: OSC commands timeout waiting for responses.

**Solutions**:

1. **Increase timeout** (requires modifying code):
   - Edit `src/osc-client.ts`
   - Increase `timeout` value in constructor
   - Rebuild: `npm run build && npm link`

2. **Check network latency** (for remote instances):
   ```bash
   ping <ableton-host>
   ```

3. **Verify OSC Remote Script** is functioning:
   - Check Ableton's log for OSC errors
   - Try reinstalling AbletonOSC

### "Permission denied" errors

**Problem**: Permission issues accessing ports or files.

**Solutions**:

1. **macOS/Linux**: Ports < 1024 require sudo:
   - Use ports ≥ 1024 (default 11000/11001 are fine)
   - Or run with appropriate permissions

2. **Windows**: Run Claude Desktop as Administrator (not recommended)
   - Better: Use standard ports ≥ 1024

### Claude doesn't understand music production terms

**Problem**: Claude doesn't know what to do with music-specific requests.

**Solution**: Be more explicit:
- ✅ "Create a MIDI track called 'Drums'"
- ✅ "Set track 0 volume to 80%"
- ❌ "Add some drums" (too vague)
- ❌ "Make it louder" (which track?)

## Usage Examples

Once configured, you can control Ableton Live naturally:

### Session Setup

> "Set up a new session at 120 BPM with 4 MIDI tracks: drums, bass, synth, and pads"

### Creating Music

> "Create an 8-bar MIDI clip called 'Drum Pattern' in track 0, scene 0"

### Mixing

> "Set track 1 to 75% volume, pan it 50% left, and solo it"

### Transport Control

> "Play from the beginning"
> "Stop playback"
> "Pause the session"

### Monitoring

> "Show me the output levels for all my tracks"

## Tips for Best Results

### 1. Be Specific

Claude works best with clear, specific instructions:
- ✅ "Create a MIDI track at position 2 called 'Lead Synth'"
- ❌ "Add a synth track somewhere"

### 2. Use Track Numbers

After creating tracks, refer to them by number:
- ✅ "Set track 3 volume to 60%"
- ❌ "Turn down the synth" (which synth?)

### 3. Work Step-by-Step

Claude can chain multiple operations:
> "Set tempo to 90 BPM, create three MIDI tracks called Drums, Bass, and Keys, then create 4-bar clips in scene 0 for each track"

### 4. Ask for Explanations

Claude can explain what it's doing:
> "Explain how to set up a basic house music session"

### 5. Use It to Learn

Ask Claude to teach you:
> "What's a good starting tempo for lo-fi hip-hop?"
> "How should I balance my drum and bass levels?"

## Benefits of MCP Integration

- **🗣️ Natural Language**: No need to remember exact commands or shortcuts
- **🤖 AI Assistance**: Claude understands context and makes smart suggestions
- **📚 Learning Tool**: Claude explains concepts as you work
- **⚡ Rapid Setup**: Set up complex sessions in seconds through conversation
- **♿ Accessibility**: Voice control makes music production more accessible
- **🔄 Workflow Enhancement**: Integrate with other MCP tools for enhanced creativity

## Security & Privacy

- studio-pilot runs entirely locally
- No data is sent to external servers (except Claude's API for LLM inference)
- OSC communication stays on your local network
- Your Ableton Live projects remain private

## Next Steps

- Read the [main README](README.md) for feature details
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to help improve studio-pilot
- Join discussions in the [Issues](https://github.com/consigcody94/studio-pilot/issues) section

## Getting Help

If you're still having issues:

1. Check the [FAQ in README.md](README.md#-faq)
2. Search [existing issues](https://github.com/consigcody94/studio-pilot/issues)
3. Create a new issue with:
   - Your OS and versions (Node.js, Ableton Live, Claude Desktop)
   - Exact error messages
   - Steps to reproduce the problem
   - Your config file (remove any sensitive info)

---

**Happy music making! 🎵**

For more information, visit: https://modelcontextprotocol.io
