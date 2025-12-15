/**
 * Model Generator Tests
 */

import { ModelGenerator } from '../src/generators/model-generator.js';
import { GenerationOptions } from '../src/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ModelGenerator', () => {
  let generator: ModelGenerator;

  beforeEach(() => {
    generator = new ModelGenerator();
  });

  describe('generate', () => {
    it('should generate a model with basic options', async () => {
      const options: GenerationOptions = {
        prompt: 'a simple cube',
        qualityMode: 'fast',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
      expect(result.modelId).toMatch(/^mf3d_/);
      expect(result.outputPath).toBeDefined();
      expect(result.mesh).toBeDefined();
      expect(result.mesh.vertexCount).toBeGreaterThan(0);
      expect(result.mesh.faceCount).toBeGreaterThan(0);
      expect(result.exports.length).toBe(1);
      expect(result.exports[0].format).toBe('obj');
      expect(result.metadata.prompt).toBe(options.prompt);
      expect(result.metadata.model).toBe('triposr'); // fast mode should select TripoSR
    }, 30000); // 30s timeout

    it('should generate with multiple output formats', async () => {
      const options: GenerationOptions = {
        prompt: 'a wooden chair',
        outputFormats: ['obj', 'fbx', 'gltf'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.exports.length).toBe(3);

      const formats = result.exports.map((e) => e.format);
      expect(formats).toContain('obj');
      expect(formats).toContain('fbx');
      expect(formats).toContain('gltf');
    }, 30000);

    it('should select Hunyuan3D-2 for character prompts', async () => {
      const options: GenerationOptions = {
        prompt: 'a medieval knight character',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('hunyuan3d-2');
    }, 30000);

    it('should select stable-dreamfusion for complex prompts', async () => {
      const options: GenerationOptions = {
        prompt: 'a highly detailed and intricate mechanical device',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('stable-dreamfusion');
    }, 30000);

    it('should respect quality mode selection', async () => {
      const options: GenerationOptions = {
        prompt: 'a simple object',
        qualityMode: 'quality',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('stable-dreamfusion');
    }, 30000);

    it('should create output files that exist', async () => {
      const options: GenerationOptions = {
        prompt: 'test model',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);

      // Check that exported files exist
      for (const exportFile of result.exports) {
        const exists = await fs
          .access(exportFile.path)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);

        // Check file size
        expect(exportFile.size).toBeGreaterThan(0);
      }
    }, 30000);

    it('should generate valid metadata', async () => {
      const options: GenerationOptions = {
        prompt: 'metadata test',
        seed: 12345,
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.metadata.prompt).toBe(options.prompt);
      expect(result.metadata.seed).toBe(12345);
      expect(result.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.metadata.generationTime).toBeGreaterThan(0);
      expect(result.metadata.version).toBe('1.0.0');
    }, 30000);

    it('should generate statistics', async () => {
      const options: GenerationOptions = {
        prompt: 'statistics test',
        outputFormats: ['obj'],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.mesh.vertexCount).toBeGreaterThan(0);
      expect(result.mesh.faceCount).toBeGreaterThan(0);
      expect(result.mesh.triangleCount).toBeGreaterThan(0);
      expect(result.mesh.hasUVs).toBe(true);
      expect(result.mesh.hasNormals).toBe(true);
      expect(result.mesh.bounds).toBeDefined();
      expect(result.mesh.bounds.min).toHaveLength(3);
      expect(result.mesh.bounds.max).toHaveLength(3);
    }, 30000);
  });
});
