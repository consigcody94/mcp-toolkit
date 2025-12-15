/**
 * TripoSR Model Wrapper
 * Fast model best for simple props and objects
 * Model size: ~2GB
 */

import { BaseAIModel, ModelInfo } from './base-model.js';
import { GenerationOptions, Mesh3D } from '../types.js';
import { logger } from '../utils/logger.js';

export class TripoSRModel extends BaseAIModel {
  constructor(modelPath: string = './models/triposr') {
    super('triposr', modelPath);
  }

  getInfo(): ModelInfo {
    return {
      name: 'TripoSR',
      version: '1.0',
      description: 'Fast single-image/text to 3D reconstruction',
      speedRating: 5, // Fastest model
      qualityRating: 3, // Medium quality
      supportsCharacters: false,
      supportsProps: true,
      supportsTextures: true,
      supportsRigging: false,
      modelSize: '2GB',
      installed: false,
    };
  }

  async checkInstalled(): Promise<boolean> {
    logger.info(`Checking if ${this.modelName} is installed at ${this.modelPath}`);
    return false;
  }

  async install(): Promise<boolean> {
    logger.info(`Installing ${this.modelName}...`);
    logger.warning('Model installation not yet implemented (Phase 2)');
    return false;
  }

  async load(): Promise<boolean> {
    if (this.isLoaded) {
      logger.info(`${this.modelName} already loaded`);
      return true;
    }

    logger.info(`Loading ${this.modelName}...`);
    logger.warning('Model loading not yet implemented (Phase 2)');

    this.isLoaded = false;
    return false;
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) {
      return;
    }

    logger.info(`Unloading ${this.modelName}...`);
    this.isLoaded = false;
  }

  async generate(options: GenerationOptions): Promise<Mesh3D> {
    this.validateOptions(options);

    logger.info(`Generating with ${this.modelName}: "${options.prompt}"`);
    logger.warning('Using mock generation (Phase 1). Real AI model integration coming in Phase 2.');

    // Phase 2 implementation will:
    // 1. Generate image from text prompt (if text-only)
    // 2. Run TripoSR image-to-3D
    // 3. Extract mesh
    // 4. Return Mesh3D object

    throw new Error('Real AI model not yet integrated. Use ModelGenerator for mock generation.');
  }
}
