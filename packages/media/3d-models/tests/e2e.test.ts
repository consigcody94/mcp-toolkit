/**
 * End-to-End Test
 * Simulate MCP protocol communication and verify complete pipeline
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('End-to-End MCP Server Test', () => {
  const serverPath = path.join(__dirname, '../dist/mcp-server.js');

  it('should complete full generation pipeline', async () => {
    // Start MCP server
    const server = spawn('node', [serverPath]);

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send initialize request
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    };

    server.stdin.write(JSON.stringify(initializeRequest) + '\n');

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Send generate_model request
    const generateRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'generate_model',
        arguments: {
          prompt: 'a test cube for e2e testing',
          qualityMode: 'fast',
          outputFormats: ['obj', 'fbx'],
        },
      },
    };

    server.stdin.write(JSON.stringify(generateRequest) + '\n');

    // Wait for generation to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Parse responses
    const responses = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((r) => r !== null);

    // Verify initialize response
    const initResponse = responses.find((r) => r.id === 1);
    expect(initResponse).toBeDefined();
    expect(initResponse?.result?.protocolVersion).toBe('2025-06-18');
    expect(initResponse?.result?.serverInfo?.name).toBe('model-forge-3d');

    // Verify generate response
    const generateResponse = responses.find((r) => r.id === 2);
    expect(generateResponse).toBeDefined();
    expect(generateResponse?.result?.success).toBe(true);
    expect(generateResponse?.result?.modelId).toMatch(/^mf3d_/);
    expect(generateResponse?.result?.exports).toHaveLength(2);

    // Verify output files exist
    const outputPath = generateResponse?.result?.outputPath;
    expect(outputPath).toBeDefined();

    if (outputPath) {
      const objPath = path.join(outputPath, 'model.obj');
      const fbxPath = path.join(outputPath, 'model.fbx');

      const objExists = await fs
        .access(objPath)
        .then(() => true)
        .catch(() => false);
      const fbxExists = await fs
        .access(fbxPath)
        .then(() => true)
        .catch(() => false);

      expect(objExists).toBe(true);
      expect(fbxExists).toBe(true);
    }

    // Cleanup
    server.kill();
  }, 30000); // 30 second timeout
});
