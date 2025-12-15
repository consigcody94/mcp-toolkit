# Model Forge 3D - Installation Guide

Complete installation instructions for Model Forge 3D MCP Server.

---

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **Python** (v3.8 or higher) - For Blender automation
   ```bash
   python3 --version  # Should be >= 3.8
   ```

3. **Blender** (v4.0 or higher) - For 3D processing
   - Download from: https://www.blender.org/download/
   - Install to default location or set `BLENDER_PATH` environment variable

4. **Git** - For repository management
   ```bash
   git --version
   ```

### Optional (for Phase 2+)

- **CUDA** - For GPU-accelerated AI model inference (NVIDIA GPUs)
- **PyTorch** - For AI model training and inference
- **Docker** - For containerized deployment

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/consigcody94/model-forge-3d.git
cd model-forge-3d
```

### 2. Install Node.js Dependencies

```bash
npm install
```

This installs:
- TypeScript 5.3
- Jest (testing framework)
- axios (HTTP client)
- zod (validation)
- ESLint & Prettier (code quality)

### 3. Install Python Dependencies

```bash
# Install Blender Python module and dependencies
pip install -r blender/requirements.txt
```

This installs:
- `bpy` (Blender Python API)
- `trimesh` (3D mesh processing)
- `numpy`, `scipy` (numerical computing)
- `Pillow` (image processing)
- `PyYAML` (configuration files)

**Note:** `bpy` installation may take 5-10 minutes as it downloads Blender binaries.

### 4. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 5. Run Tests

```bash
npm test
```

Expected output:
```
Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
```

---

## Configuration

### Claude Desktop Integration

Add Model Forge 3D to your Claude Desktop configuration:

#### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": ["/path/to/model-forge-3d/dist/mcp-server.js"],
      "env": {
        "BLENDER_PATH": "/Applications/Blender.app/Contents/MacOS/Blender"
      }
    }
  }
}
```

#### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\model-forge-3d\\dist\\mcp-server.js"],
      "env": {
        "BLENDER_PATH": "C:\\Program Files\\Blender Foundation\\Blender\\blender.exe"
      }
    }
  }
}
```

#### Linux
Edit: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "model-forge-3d": {
      "command": "node",
      "args": ["/home/username/model-forge-3d/dist/mcp-server.js"],
      "env": {
        "BLENDER_PATH": "/usr/bin/blender"
      }
    }
  }
}
```

### Environment Variables

Create a `.env` file in the project root (optional):

```bash
# Blender executable path (if not in system PATH)
BLENDER_PATH=/usr/local/bin/blender

# AI model paths (Phase 2+)
MODEL_PATH_HUNYUAN3D=./models/hunyuan3d-2
MODEL_PATH_TRIPOSR=./models/triposr
MODEL_PATH_DREAMFUSION=./models/stable-dreamfusion
MODEL_PATH_INSTANTMESH=./models/instantmesh

# Output directory for generated models
OUTPUT_DIR=./output

# Logging level (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

---

## Verifying Installation

### 1. Test MCP Server Startup

```bash
npm start
```

You should see:
```
Model Forge 3D MCP Server v1.0.0 starting...
Listening on stdin for MCP requests
```

Press Ctrl+C to stop.

### 2. Test Blender Integration

```bash
blender --version
```

Should output Blender version (e.g., `Blender 4.0.0`).

Test Python automation:
```bash
python3 blender/blender_wrapper.py --help
```

### 3. Test with Claude Desktop

1. **Restart Claude Desktop** after adding MCP configuration
2. Start a new conversation
3. Test with: "List supported 3D AI models"
4. Try: "Generate a simple cube model"

You should see the model generated in the `output/` directory.

---

## Troubleshooting

### "Blender executable not found"

**Solution:** Set `BLENDER_PATH` environment variable or install Blender to default location.

```bash
# Find Blender location
which blender  # Linux/macOS
where blender  # Windows

# Set in MCP config
"env": {
  "BLENDER_PATH": "/path/to/blender"
}
```

### "Module 'bpy' not found"

**Solution:** Install bpy via pip:

```bash
pip install bpy==4.2.0
```

If installation fails, try:
```bash
pip install --upgrade pip
pip install bpy==4.2.0 --no-cache-dir
```

### Tests failing

**Solution:** Rebuild and clean install:

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

### MCP Server not showing in Claude

**Solution:**
1. Verify JSON syntax in `claude_desktop_config.json`
2. Check absolute paths (not relative paths like `~/`)
3. Restart Claude Desktop completely
4. Check logs in Claude Desktop Developer Tools (Help → Developer Tools → Console)

### TypeScript compilation errors

**Solution:**

```bash
npm run typecheck  # Check for type errors
npm run lint       # Check for linting errors
npm run format     # Auto-fix formatting
```

---

## Phase 2 Setup (AI Models)

**Coming Soon:** Instructions for installing AI models.

Currently, Model Forge 3D uses mock generation (Phase 1). Phase 2 will add:

1. **Hunyuan3D-2** (~8GB download)
   - Character and humanoid generation
   - State-of-the-art quality

2. **TripoSR** (~2GB download)
   - Fast prop generation
   - Ultra-fast inference

3. **Stable DreamFusion** (~5GB download)
   - Highest quality generation
   - NeRF-based rendering

4. **InstantMesh** (~3GB download)
   - Image-to-3D conversion
   - Multi-view reconstruction

Installation script coming in Phase 2:
```bash
npm run install-models  # Downloads all AI models (~18GB total)
```

---

## Uninstallation

```bash
# Remove Node.js dependencies
rm -rf node_modules dist

# Remove Python dependencies
pip uninstall -y bpy trimesh numpy scipy Pillow PyYAML

# Remove from Claude Desktop
# Delete the "model-forge-3d" entry from claude_desktop_config.json

# Remove repository
cd ..
rm -rf model-forge-3d
```

---

## Getting Help

- **Issues:** https://github.com/consigcody94/model-forge-3d/issues
- **Documentation:** See README.md, MCP_SETUP.md, CONTRIBUTING.md
- **Discord:** (Coming soon)

---

**Installation complete!** You're ready to generate 3D models from text with Model Forge 3D.
