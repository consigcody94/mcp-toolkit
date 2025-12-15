/**
 * Model Generator - Core 3D generation engine
 * Orchestrates AI model selection, generation, and processing pipeline
 */

import {
  GenerationOptions,
  GenerationResult,
  AIModelType,
  MeshStatistics,
  ExportedFile,
} from '../types.js';
import { generateModelId } from '../utils/id-generator.js';
import { logInfo, logError, logWarning } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ModelGenerator {
  private outputDir: string;

  constructor() {
    // Set up output directory
    const projectRoot = path.join(__dirname, '../..');
    this.outputDir = path.join(projectRoot, 'output');
  }

  /**
   * Select appropriate AI model based on generation options
   */
  private selectAIModel(options: GenerationOptions): AIModelType {
    if (!options.autoSelectModel && options.qualityMode) {
      // Map quality mode to model
      switch (options.qualityMode) {
        case 'fast':
          return 'triposr';
        case 'quality':
          return 'stable-dreamfusion';
        case 'balanced':
        default:
          return 'hunyuan3d-2';
      }
    }

    // Auto-select based on prompt analysis
    const prompt = options.prompt.toLowerCase();

    // Character/humanoid detection
    if (
      prompt.includes('character') ||
      prompt.includes('person') ||
      prompt.includes('human') ||
      prompt.includes('avatar') ||
      prompt.includes('knight') ||
      prompt.includes('warrior')
    ) {
      logInfo('Detected character/humanoid → selecting Hunyuan3D-2');
      return 'hunyuan3d-2';
    }

    // Simple prop detection
    if (
      prompt.includes('chair') ||
      prompt.includes('table') ||
      prompt.includes('box') ||
      prompt.includes('cube') ||
      prompt.includes('sphere')
    ) {
      logInfo('Detected simple prop → selecting TripoSR for speed');
      return 'triposr';
    }

    // Complex scene detection
    if (
      prompt.includes('detailed') ||
      prompt.includes('intricate') ||
      prompt.includes('complex') ||
      prompt.includes('realistic')
    ) {
      logInfo('Detected complex requirements → selecting stable-dreamfusion');
      return 'stable-dreamfusion';
    }

    // Default: balanced option
    logInfo('Using default model → Hunyuan3D-2');
    return 'hunyuan3d-2';
  }

  /**
   * Generate 3D mesh using AI model (Phase 1: Mock implementation)
   * TODO: Replace with actual AI model integration in Phase 2
   */
  private async generateMesh(
    prompt: string,
    model: AIModelType,
    _options: GenerationOptions
  ): Promise<{ meshPath: string; statistics: MeshStatistics }> {
    logInfo(`Generating mesh with ${model} for prompt: "${prompt}"`);

    // Create output directory
    const modelId = generateModelId();
    const modelDir = path.join(this.outputDir, modelId);
    await fs.mkdir(modelDir, { recursive: true });

    // Phase 1: Create a simple mock mesh file
    // TODO Phase 2: Replace with actual AI model inference
    logWarning('PHASE 1: Using mock mesh generation. Real AI models coming in Phase 2.');

    const meshPath = path.join(modelDir, 'generated_mesh.obj');

    // Create a simple cube OBJ file as placeholder
    const cubeOBJ = `# Model Forge 3D - Generated Mesh
# Prompt: ${prompt}
# Model: ${model}
# Generated: ${new Date().toISOString()}

v -1.0 -1.0  1.0
v  1.0 -1.0  1.0
v  1.0  1.0  1.0
v -1.0  1.0  1.0
v -1.0 -1.0 -1.0
v  1.0 -1.0 -1.0
v  1.0  1.0 -1.0
v -1.0  1.0 -1.0

vt 0.0 0.0
vt 1.0 0.0
vt 1.0 1.0
vt 0.0 1.0

vn  0.0  0.0  1.0
vn  0.0  0.0 -1.0
vn  0.0  1.0  0.0
vn  0.0 -1.0  0.0
vn  1.0  0.0  0.0
vn -1.0  0.0  0.0

f 1/1/1 2/2/1 3/3/1 4/4/1
f 5/1/2 6/2/2 7/3/2 8/4/2
f 4/1/3 3/2/3 7/3/3 8/4/3
f 1/1/4 2/2/4 6/3/4 5/4/4
f 2/1/5 3/2/5 7/3/5 6/4/5
f 1/1/6 4/2/6 8/3/6 5/4/6
`;

    await fs.writeFile(meshPath, cubeOBJ, 'utf-8');
    logInfo(`Mock mesh saved to: ${meshPath}`);

    // Calculate statistics
    const statistics: MeshStatistics = {
      vertexCount: 8,
      faceCount: 6,
      triangleCount: 12,
      materialCount: 1,
      hasUVs: true,
      hasNormals: true,
      isManifold: true,
      bounds: {
        min: [-1, -1, -1],
        max: [1, 1, 1],
        center: [0, 0, 0],
        size: [2, 2, 2],
      },
      surfaceArea: 24.0,
      volume: 8.0,
    };

    return { meshPath, statistics };
  }

  /**
   * Export mesh to requested formats
   */
  private async exportMesh(meshPath: string, formats: string[], modelDir: string): Promise<ExportedFile[]> {
    const exports: ExportedFile[] = [];

    for (const format of formats) {
      logInfo(`Exporting to ${format.toUpperCase()} format`);

      const exportPath = path.join(modelDir, `model.${format}`);

      // Phase 1: Copy OBJ file for all formats as placeholder
      // TODO Phase 2: Implement actual format conversion via Blender/PyAssimp
      await fs.copyFile(meshPath, exportPath);

      const stats = await fs.stat(exportPath);

      exports.push({
        format: format as 'fbx' | 'obj' | 'gltf' | 'glb' | 'dae',
        path: exportPath,
        size: stats.size,
      });

      logInfo(`Exported ${format.toUpperCase()}: ${exportPath}`);
    }

    return exports;
  }

  /**
   * Main generation pipeline
   */
  async generate(options: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const modelId = generateModelId();

    try {
      logInfo('========================================');
      logInfo('Starting Model Forge 3D generation');
      logInfo(`Model ID: ${modelId}`);
      logInfo(`Prompt: "${options.prompt}"`);
      logInfo('========================================');

      // Step 1: Select AI model
      const selectedModel = this.selectAIModel(options);
      logInfo(`Selected AI model: ${selectedModel}`);

      // Step 2: Generate mesh
      const { meshPath, statistics } = await this.generateMesh(options.prompt, selectedModel, options);

      // Step 3: Create model directory
      const modelDir = path.dirname(meshPath);

      // Step 4: Export to requested formats
      const exports = await this.exportMesh(meshPath, options.outputFormats || ['fbx', 'obj', 'gltf'], modelDir);

      // Step 5: Generate metadata
      const generationTime = Date.now() - startTime;

      const result: GenerationResult = {
        success: true,
        modelId,
        outputPath: modelDir,
        mesh: statistics,
        exports,
        metadata: {
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          model: selectedModel,
          seed: options.seed || Math.floor(Math.random() * 1000000),
          generationTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };

      logInfo('========================================');
      logInfo('Generation completed successfully!');
      logInfo(`Total time: ${(generationTime / 1000).toFixed(2)}s`);
      logInfo(`Output directory: ${modelDir}`);
      logInfo(`Files generated: ${exports.length}`);
      logInfo('========================================');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(`Generation failed: ${errorMessage}`);

      return {
        success: false,
        modelId,
        outputPath: '',
        mesh: {
          vertexCount: 0,
          faceCount: 0,
          triangleCount: 0,
          materialCount: 0,
          hasUVs: false,
          hasNormals: false,
          isManifold: false,
          bounds: {
            min: [0, 0, 0],
            max: [0, 0, 0],
            center: [0, 0, 0],
            size: [0, 0, 0],
          },
          surfaceArea: 0,
          volume: 0,
        },
        exports: [],
        metadata: {
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          model: 'hunyuan3d-2',
          seed: options.seed || 0,
          generationTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
        error: errorMessage,
      };
    }
  }
}
