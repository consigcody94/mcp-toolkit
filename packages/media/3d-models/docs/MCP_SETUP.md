# MCP Setup for Claude Desktop

This guide walks you through setting up Model Forge 3D as an MCP server in Claude Desktop.

---

## Prerequisites

- **Node.js 18+** installed
- **Claude Desktop** application
- **Model Forge 3D** built and ready

---

## Installation Steps

### 1. Build Model Forge 3D

```bash
cd path/to/model-forge-3d
npm install
npm run build
```

### 2. Locate Claude Desktop Configuration

The configuration file location depends on your operating system:

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 3. Edit Configuration File

Add Model Forge 3D to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": [
        "/absolute/path/to/model-forge-3d/dist/mcp-server.js"
      ]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/model-forge-3d` with the actual absolute path.

**Example (macOS/Linux):**
```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": [
        "/home/username/model-forge-3d/dist/mcp-server.js"
      ]
    }
  }
}
```

**Example (Windows):**
```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": [
        "C:\\Users\\username\\model-forge-3d\\dist\\mcp-server.js"
      ]
    }
  }
}
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### 5. Verify Installation

In Claude Desktop, you can now use natural language to generate 3D models:

```
"Create a medieval knight character for VRChat"

"Generate a wooden chair with high quality textures"

"Make a simple cube and export it as FBX and OBJ"
```

---

## Usage Examples

### Basic Generation

```
Generate a 3D model of a fantasy sword
```

Claude will use the `generate_model` tool with default settings.

### Custom Quality

```
Create a detailed sci-fi robot with high quality settings
```

Claude will adjust `qualityMode` and `textureResolution` based on your request.

### Multiple Formats

```
Generate a table and export it as FBX, OBJ, and GLTF
```

Claude will set `outputFormats: ["fbx", "obj", "gltf"]`.

### Platform-Specific

```
Create a VRChat avatar of a cat character, optimized for Quest
```

Claude will use appropriate poly count and rigging settings.

---

## Troubleshooting

### Server Not Connecting

**Check logs:**
- macOS/Linux: `~/Library/Application Support/Claude/logs/mcp-server-model-forge-3d.log`
- Windows: `%APPDATA%\Claude\logs\mcp-server-model-forge-3d.log`

**Common issues:**
1. **Incorrect path** - Verify the absolute path in config
2. **Node.js not in PATH** - Use full path to node: `/usr/bin/node` or `C:\Program Files\nodejs\node.exe`
3. **Build not complete** - Run `npm run build` again
4. **Permissions** - Ensure the MCP server script is executable

### Slow Generation

- **Fast mode** - Ask for "fast generation" or "quick prototype"
- **Simple prompts** - Complex prompts take longer (10-15 minutes)
- **Hardware** - Generation speed depends on your GPU

### Output Location

Generated models are saved to:
```
model-forge-3d/output/<model-id>/
```

Each generation creates a unique folder with all exported files.

---

## Configuration Options

### Custom Output Directory

Set environment variable before starting:

```bash
export MODEL_FORGE_OUTPUT=/path/to/custom/output
```

Or in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": [
        "/path/to/model-forge-3d/dist/mcp-server.js"
      ],
      "env": {
        "MODEL_FORGE_OUTPUT": "/path/to/custom/output"
      }
    }
  }
}
```

---

## Advanced Usage

### List Available Models

```
What AI models does Model Forge 3D support?
```

Claude will call `list_supported_models` to show all available AI models.

### Reproducible Generation

```
Generate a cube with seed 12345
```

Using the same seed produces the same result every time.

### Batch Generation

```
Generate 5 variations of a fantasy sword
```

Claude can call `generate_model` multiple times with different seeds.

---

## WSL (Windows Subsystem for Linux)

If you have Model Forge 3D installed in WSL:

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "wsl",
      "args": [
        "bash",
        "-c",
        "cd /home/username/model-forge-3d && node dist/mcp-server.js"
      ]
    }
  }
}
```

---

## Performance Tips

1. **Fast generation** - Use `qualityMode: "fast"` for quick iterations
2. **Lower resolution** - Use 1024 textures for prototyping
3. **Simple prompts** - Short, clear prompts generate faster
4. **GPU acceleration** - Ensure you have a compatible NVIDIA GPU (Phase 2)

---

## Next Steps

- Read the [API Reference](./API.md)
- Try [Example Prompts](../examples/)
- Join discussions on GitHub

---

**Need help?** Open an issue on [GitHub](https://github.com/yourusername/model-forge-3d/issues)
